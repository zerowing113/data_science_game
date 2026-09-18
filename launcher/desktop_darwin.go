package main

import "os/exec"

func openBrowser(url string) error { return exec.Command("open", url).Run() }
func showError(message string) {
	// Pass the message as data, not interpolated AppleScript source.
	exec.Command("osascript", "-e", `on run argv
display alert "Little Goods could not start" message (item 1 of argv) as critical
end run`, message).Run()
}
