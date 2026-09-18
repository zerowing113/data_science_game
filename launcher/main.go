package main

import (
	"context"
	"crypto/rand"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"time"
)

//go:embed web
var content embed.FS
var version = "development"

type status struct {
	App     string `json:"app"`
	Version string `json:"version"`
	Token   string `json:"token"`
}

func main() {
	headless := flag.Bool("headless", false, "Do not open a browser or show native dialogs (automated verification)")
	port := flag.Int("port", 43127, "Local port; keep the default for normal play")
	flag.Parse()
	if err := run(*port, *headless); err != nil {
		fmt.Fprintln(os.Stderr, err)
		if !*headless {
			showError(err.Error())
		}
		os.Exit(1)
	}
}

func run(port int, headless bool) error {
	if port < 1024 || port > 65535 {
		return errors.New("Choose a local port from 1024 to 65535.")
	}
	host := net.JoinHostPort("127.0.0.1", strconv.Itoa(port))
	origin := "http://" + host
	listener, err := net.Listen("tcp4", host)
	if err != nil {
		// Another launch may still be starting its HTTP service. Reuse only a
		// matching version; never open whatever unrelated service owns the port.
		client := &http.Client{Timeout: 300 * time.Millisecond, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
		for i := 0; i < 10; i++ {
			response, requestErr := client.Get(origin + "/__launcher/status")
			if requestErr == nil {
				var existing status
				decodeErr := json.NewDecoder(http.MaxBytesReader(nil, response.Body, 4096)).Decode(&existing)
				response.Body.Close()
				if response.StatusCode == 200 && decodeErr == nil && existing.App == "little-goods" {
					if existing.Version != version {
						return errors.New("Another Little Goods version is running. Use Stop game in its browser tab, then launch this version again.")
					}
					if !headless {
						return openBrowser(origin)
					}
					return nil
				}
			}
			time.Sleep(100 * time.Millisecond)
		}
		return fmt.Errorf("Little Goods could not use local port %d. Another program may be using it. Close that program and try Start Game again. No game data was changed.", port)
	}
	defer listener.Close()
	assets, err := fs.Sub(content, "web")
	if err != nil {
		return fmt.Errorf("The game package is incomplete. Download and extract it again: %w", err)
	}
	tokenBytes := make([]byte, 32)
	if _, err = rand.Read(tokenBytes); err != nil {
		return err
	}
	current := status{App: "little-goods", Version: version, Token: hex.EncodeToString(tokenBytes)}
	stop := make(chan struct{}, 1)
	files := http.FileServer(http.FS(assets))
	server := &http.Server{ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 30 * time.Second}
	server.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Cache-Control", "no-store")
		// Reject remote Host/Origin values, including DNS-rebinding requests.
		if r.Host != host || (r.Header.Get("Origin") != "" && r.Header.Get("Origin") != origin) {
			http.Error(w, "This game is available only on this computer.", http.StatusForbidden)
			return
		}
		switch r.URL.Path {
		case "/__launcher/status":
			if r.Method != http.MethodGet {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(current)
		case "/__launcher/stop":
			if r.Method != http.MethodPost {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			if r.Header.Get("Origin") != origin || r.Header.Get("X-Launcher-Token") != current.Token {
				w.WriteHeader(http.StatusForbidden)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprint(w, `{"stopped":true}`)
			select {
			case stop <- struct{}{}:
			default:
			}
		default:
			if r.Method != http.MethodGet && r.Method != http.MethodHead {
				w.WriteHeader(http.StatusMethodNotAllowed)
				return
			}
			// Do not expose directory listings; only packaged files are readable.
			name := r.URL.Path
			if name == "/" {
				name = "/index.html"
			}
			entry, statErr := fs.Stat(assets, name[1:])
			if statErr != nil || entry.IsDir() {
				http.NotFound(w, r)
				return
			}
			if len(name) > 4 && name[len(name)-4:] == ".mjs" {
				w.Header().Set("Content-Type", "text/javascript; charset=utf-8")
			}
			if len(name) > 5 && name[len(name)-5:] == ".wasm" {
				w.Header().Set("Content-Type", "application/wasm")
			}
			files.ServeHTTP(w, r)
		}
	})
	served := make(chan error, 1)
	go func() { served <- server.Serve(listener) }()
	if !headless {
		if err := openBrowser(origin); err != nil {
			server.Close()
			return fmt.Errorf("Could not open your browser. Try launching again after setting a default browser. %w", err)
		}
	}
	fmt.Println(origin)
	interrupted := make(chan os.Signal, 1)
	signal.Notify(interrupted, os.Interrupt)
	defer signal.Stop(interrupted)
	select {
	case err := <-served:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-stop:
	case <-interrupted:
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		// A partially downloaded wheel must not keep Stop game alive indefinitely.
		server.Close()
		if !errors.Is(err, context.DeadlineExceeded) {
			return err
		}
	}
	return nil
}
