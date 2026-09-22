/** A shop illustration, not a view of committed inventory or unrevealed demand. */
export function ShopScene() {
  return <section className="shop-scene" aria-labelledby="shop-title">
    <svg viewBox="0 0 480 250" role="img" aria-label="Little Goods packing studio: ceramic mugs on rounded shelves, a plant, and parcels ready for the online shop">
      <rect width="480" height="250" rx="20" fill="#f4e6d2" />
      <path d="M0 208H480V250H0Z" fill="#dac5a7" />
      <path d="M28 208V69Q28 24 75 24H153Q194 24 194 69V208" fill="#c1cbb5" />
      <path d="M40 204V70Q40 36 76 36H152Q182 36 182 70V204" fill="#fff6e7" />
      <path d="M109 37V199M42 111H180" stroke="#d7bc98" strokeWidth="7" />
      <circle cx="146" cy="72" r="20" fill="#f1cd79" />
      <path d="M42 165Q82 119 110 155Q142 119 180 155V202H42Z" fill="#dbe1c5" />
      <rect x="220" y="30" width="225" height="37" rx="12" fill="#315b4b" />
      <text x="332" y="54" textAnchor="middle" fill="#fff4de" fontSize="18" fontFamily="Georgia, serif">little goods co.</text>
      {[95, 152].map((y, shelf) => <g key={y}>
        <rect x="224" y={y + 25} width="216" height="10" rx="5" fill="#b58360" />
        {[242, 298, 354, 402].map((x, index) => <g key={x} transform={`translate(${x} ${y})`}>
          <path d="M21 3H26C37 3 37 17 26 17H22" fill="none" stroke={['#ba7153', '#80967b', '#c9a252', '#ba7153'][(index + shelf) % 4]} strokeWidth="5" />
          <path d="M0 0H24V17Q24 25 16 25H8Q0 25 0 17Z" fill={['#cf9277', '#a3b497', '#e4c584', '#cf9277'][(index + shelf) % 4]} />
          <path d="M5 4V15" stroke="#fff5df" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        </g>)}
      </g>)}
      <path d="M26 201H203V213H26ZM44 213V246M187 213V246" stroke="#936748" strokeWidth="10" strokeLinejoin="round" />
      <rect x="57" y="169" width="54" height="31" rx="4" fill="#c9915f" />
      <path d="M81 169V200" stroke="#f1d4a2" strokeWidth="9" />
      <rect x="122" y="180" width="43" height="21" rx="3" fill="#e9bd83" />
      <path d="M142 180V201" stroke="#fff1ce" strokeWidth="6" />
      <rect x="265" y="204" width="169" height="38" rx="9" fill="#718b72" />
      <path d="M278 215H419M278 224H419" stroke="#b3c1a3" strokeWidth="2" />
      <g className="shop-leaves">
        <path d="M232 214V175" stroke="#637d54" strokeWidth="4" />
        <path d="M231 195Q202 191 210 169Q233 172 231 195M233 180Q231 154 252 156Q255 177 233 180" fill="#748d61" />
      </g>
      <path d="M216 203H250L246 231H221Z" fill="#be7659" />
    </svg>
    <div className="shop-story">
      <span className="eyebrow">YOUR ONLINE MUG SHOP</span>
      <h2 id="shop-title">Small shop. Big decisions.</h2>
      <p>Meet The Everyday Mug. Look for patterns in past demand, then use Python to plan for the week ahead.</p>
      <div className="shop-facts"><div><span>History</span><strong>28 days</strong></div><span className="journey-arrow" aria-hidden="true">→</span><div><span>Forecast horizon</span><strong>Next 7 days</strong></div></div>
      <small>Illustrated display, not inventory. Demand means mugs wanted, not sales fulfilled.</small>
    </div>
  </section>;
}
