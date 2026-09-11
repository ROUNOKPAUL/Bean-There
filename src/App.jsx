import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  ArrowUpRight,
  Coffee,
  Filter,
  Heart,
  Info,
  LockKeyhole,
  Mail,
  Map as MapIcon,
  Menu,
  Route,
  Search,
  SlidersHorizontal,
  Sparkles,
  Wifi,
  X,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react'
import { fallbackCafes } from './data'

const KOLKATA = [22.5726, 88.3639]

const markerIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div class="marker-pin"><span>☕</span></div>',
  iconSize: [42, 48],
  iconAnchor: [21, 45],
  popupAnchor: [0, -43],
})

function RecenterMap({ cafes }) {
  const map = useMap()
  useEffect(() => {
    if (cafes.length) {
      map.fitBounds(cafes.map((cafe) => [cafe.lat, cafe.lng]), { padding: [40, 40], maxZoom: 13 })
    }
  }, [cafes, map])
  return null
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('bean-there-auth') === 'true')
  const [route, setRoute] = useState(() => window.location.hash || '#discover')
  const [cafes, setCafes] = useState(fallbackCafes)
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All cafés')
  const [price, setPrice] = useState('Any price')
  const [sort, setSort] = useState('Recommended')
  const [favorites, setFavorites] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState('fallback')
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || '#discover')
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    let ignore = false
    async function loadCafes() {
      setIsLoading(true)
      try {
        const query = `[out:json][timeout:10];area["name"="Kolkata"]["boundary"="administrative"]->.searchArea;(node["amenity"="cafe"](area.searchArea);way["amenity"="cafe"](area.searchArea););out center tags;`
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: new URLSearchParams({ data: query }),
        })
        if (!response.ok) throw new Error(`Overpass responded with ${response.status}`)
        const data = await response.json()
        const liveCafes = data.elements
          .map((item, index) => {
            const tags = item.tags || {}
            const lat = item.lat || item.center?.lat
            const lng = item.lon || item.center?.lon
            if (!lat || !lng || !tags.name) return null
            return {
              ...fallbackCafes[index % fallbackCafes.length],
              id: String(item.id),
              name: tags.name,
              address: tags['addr:street'] || tags['addr:full'] || 'Kolkata, West Bengal',
              area: tags['addr:suburb'] || tags['addr:neighbourhood'] || 'Kolkata',
              lat,
              lng,
              note: tags.description || 'A local café worth discovering in Kolkata.',
              wifi: tags.internet_access === 'wlan' || tags.wifi === 'yes',
              price: tags.price_range === '1' ? 1 : tags.price_range === '3' ? 3 : 2,
              priceLabel: tags.price_range === '1' ? '₹' : tags.price_range === '3' ? '₹₹₹' : '₹₹',
            }
          })
          .filter(Boolean)
        if (!ignore && liveCafes.length >= 3) {
          setCafes([...fallbackCafes, ...liveCafes.filter((live) => !fallbackCafes.some((fallback) => fallback.name.toLowerCase() === live.name.toLowerCase()))])
          setApiStatus('live')
        }
      } catch {
        if (!ignore) setApiStatus('fallback')
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    loadCafes()
    return () => {
      ignore = true
    }
  }, [])

  const filteredCafes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = cafes.filter((cafe) => {
      const matchesQuery =
        !normalizedQuery ||
        [cafe.name, cafe.area, cafe.address, ...(cafe.tags || [])].some((value) =>
          String(value).toLowerCase().includes(normalizedQuery),
        )
      const matchesFilter =
        activeFilter === 'All cafés' ||
        (activeFilter === 'Wi‑Fi' && cafe.wifi) ||
        (activeFilter === 'Power outlets' && cafe.power) ||
        (activeFilter === 'Open now' && cafe.hours.includes('Open'))
      const matchesPrice = price === 'Any price' || cafe.priceLabel === price
      return matchesQuery && matchesFilter && matchesPrice
    })
    return [...result].sort((a, b) => {
      if (sort === 'Rating') return b.rating - a.rating
      if (sort === 'Price: low to high') return a.price - b.price
      return b.rating + Number(b.wifi) * 0.15 - (a.rating + Number(a.wifi) * 0.15)
    })
  }, [cafes, query, activeFilter, price, sort])

  function toggleFavorite(id) {
    setFavorites((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const areas = useMemo(() => [...new Set(cafes.map((cafe) => cafe.area).filter(Boolean))].sort(), [cafes])
  function goTo(nextRoute) {
    window.location.hash = nextRoute
    setShowMenu(false)
  }

  function logOut() {
    localStorage.removeItem('bean-there-auth')
    setIsAuthenticated(false)
    window.location.hash = '#login'
  }

  if (!isAuthenticated || route === '#login') {
    return <LoginPage onLogin={() => { localStorage.setItem('bean-there-auth', 'true'); setIsAuthenticated(true); window.location.hash = '#discover' }} />
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b border-[#e8e2d9] bg-cream/95">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 lg:px-10">
          <a href="#discover" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-espresso text-xl text-[#f5d8a8]">☕</span>
            <span className="font-display text-xl font-bold tracking-[-0.04em]">bean there<span className="text-terracotta">.</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#706a62] md:flex">
            <a className={route === '#discover' ? 'text-ink' : ''} href="#discover">Discover</a>
            <a className={route === '#how-it-works' ? 'text-ink' : ''} href="#how-it-works">How it works</a>
            <a className={route === '#about' ? 'text-ink' : ''} href="#about">About</a>
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <button onClick={logOut} className="rounded-full px-3 py-2 text-sm font-semibold text-[#706a62] transition hover:text-espresso">Log out</button>
            <button className="rounded-full bg-espresso px-5 py-3 text-sm font-bold text-white transition hover:bg-[#55382e]">
              List your café <ArrowUpRight className="ml-1 inline h-4 w-4" />
            </button>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="rounded-full p-2 md:hidden" aria-label="Open menu"><Menu /></button>
        </div>
        {showMenu && <nav className="border-t border-[#e8e2d9] px-5 py-4 md:hidden"><div className="flex flex-col gap-3 text-sm font-semibold text-[#706a62]"><a onClick={() => setShowMenu(false)} href="#discover">Discover</a><a onClick={() => setShowMenu(false)} href="#how-it-works">How it works</a><a onClick={() => setShowMenu(false)} href="#about">About</a><a onClick={() => setShowMenu(false)} href="#favorites">Saved cafés ({favorites.length})</a><button onClick={logOut} className="text-left text-terracotta">Log out</button></div></nav>}
      </header>

      <main>
        {route === '#how-it-works' && <InfoPage />}
        {route === '#about' && <AboutPage />}
        {route === '#favorites' && <FavoritesPage cafes={cafes.filter((cafe) => favorites.includes(cafe.id))} onFavorite={toggleFavorite} />}
        {route !== '#how-it-works' && route !== '#about' && route !== '#favorites' && <>
        <section className="mx-auto max-w-[1440px] px-5 pb-10 pt-12 lg:px-10 lg:pt-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e5d4bf] bg-[#fbf1e6] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-terracotta">
              <Sparkles className="h-3.5 w-3.5" /> Curated for Kolkata
            </div>
            <h1 className="font-serif text-5xl leading-[0.98] tracking-[-0.04em] text-espresso sm:text-7xl">
              Find your next<br /><em className="font-normal text-terracotta">coffee corner.</em>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#706a62] sm:text-lg">
              Your guide to Kolkata&apos;s best cafés for deep work, slow mornings, and everything in between.
            </p>
          </div>
          <div className="mt-10 flex flex-col gap-4 lg:flex-row">
            <label className="flex h-14 flex-1 items-center gap-3 rounded-2xl border border-[#ded8cf] bg-white px-5 shadow-sm focus-within:border-terracotta">
              <Search className="h-5 w-5 text-[#999087]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-[#999087]" placeholder="Search by café, area, or vibe..." />
              {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X className="h-4 w-4 text-[#999087]" /></button>}
            </label>
            <div className="flex flex-wrap items-center gap-2 lg:absolute lg:mt-[70px]">
              <span className="text-xs font-bold text-[#999087]">Try an area:</span>
              {areas.slice(0, 5).map((area) => <button key={area} onClick={() => setQuery(area)} className="rounded-full border border-[#e5d4bf] bg-[#fbf1e6] px-2.5 py-1 text-xs font-semibold text-terracotta transition hover:bg-[#f2e5d8]">{area}</button>)}
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-[#ded8cf] bg-white px-6 text-sm font-bold lg:hidden">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
            <div className="hidden items-center gap-2 rounded-2xl border border-[#ded8cf] bg-white px-4 lg:flex">
              <span className="text-xs font-semibold text-[#999087]">Sort by</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent py-2 text-sm font-bold outline-none">
                <option>Recommended</option><option>Rating</option><option>Price: low to high</option>
              </select>
            </div>
          </div>
        </section>

        <section id="discover" className="border-y border-[#e8e2d9] bg-[#fbfaf7]">
          <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
            <aside className={`${showFilters ? 'block' : 'hidden'} border-b border-[#e8e2d9] px-5 py-6 lg:block lg:w-[250px] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-10 lg:py-8`}>
              <div className="mb-7 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold"><Filter className="h-4 w-4" /> Filter by</span>
                <button className="text-xs font-semibold text-terracotta" onClick={() => { setActiveFilter('All cafés'); setPrice('Any price') }}>Reset</button>
              </div>
              <div className="mb-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#999087]">Amenities</p>
                <div className="space-y-1">
                  {['All cafés', 'Wi‑Fi', 'Power outlets', 'Open now'].map((filter) => (
                    <button key={filter} onClick={() => setActiveFilter(filter)} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${activeFilter === filter ? 'bg-[#f2e5d8] font-bold text-espresso' : 'text-[#706a62] hover:bg-[#f3f0eb]'}`}>
                      <span>{filter}</span>{activeFilter === filter && <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[#999087]">Price range</p>
                <div className="flex gap-2">
                  {['₹', '₹₹', '₹₹₹'].map((option) => <button key={option} onClick={() => setPrice(price === option ? 'Any price' : option)} className={`h-9 w-11 rounded-lg border text-sm font-bold ${price === option ? 'border-terracotta bg-[#f2e5d8] text-terracotta' : 'border-[#ded8cf] bg-white text-[#999087]'}`}>{option}</button>)}
                </div>
              </div>
            </aside>
            <div className="min-w-0 flex-1 p-5 lg:p-8">
              <div className="mb-5 flex items-center justify-between">
                <div><h2 className="font-serif text-2xl text-espresso">{isLoading ? 'Finding cafés...' : `${filteredCafes.length} cafés to explore`}</h2><p className="mt-1 text-xs text-[#999087]">{apiStatus === 'live' ? 'Live places from OpenStreetMap' : 'A handpicked Kolkata starter list'}</p></div>
                <div className="flex items-center gap-2 rounded-full bg-[#edf2eb] px-3 py-1.5 text-xs font-bold text-sage"><span className="h-2 w-2 animate-pulse rounded-full bg-sage" /> Kolkata</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCafes.map((cafe) => <CafeCard key={cafe.id} cafe={cafe} favorite={favorites.includes(cafe.id)} onFavorite={() => toggleFavorite(cafe.id)} />)}
              </div>
              {!filteredCafes.length && <div className="rounded-2xl border border-dashed border-[#d8d0c5] bg-white p-12 text-center"><Coffee className="mx-auto h-8 w-8 text-[#c5b9aa]" /><p className="mt-3 font-serif text-xl text-espresso">No cafés found</p><p className="mt-1 text-sm text-[#999087]">Try a different area or remove a filter.</p></div>}
            </div>
            <div className="h-[420px] lg:sticky lg:top-0 lg:h-[calc(100vh-1px)] lg:w-[38%]">
              <MapContainer center={KOLKATA} zoom={12} scrollWheelZoom={false} className="h-full w-full">
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <RecenterMap cafes={filteredCafes} />
                {filteredCafes.map((cafe) => <Marker key={cafe.id} position={[cafe.lat, cafe.lng]} icon={markerIcon}><Popup><strong>{cafe.name}</strong><br />{cafe.area}<br /><span>★ {cafe.rating} · {cafe.priceLabel}</span></Popup></Marker>)}
              </MapContainer>
              <div className="pointer-events-none absolute bottom-5 right-5 z-[1000] hidden rounded-xl bg-white/90 px-3 py-2 text-[11px] font-semibold text-[#706a62] shadow-lg backdrop-blur sm:block"><MapIcon className="mr-1 inline h-3.5 w-3.5" /> Map data © OpenStreetMap</div>
            </div>
          </div>
        </section>
        </>}
      </main>
      <footer className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 px-5 py-8 text-xs text-[#999087] sm:flex-row lg:px-10"><span>Made for coffee people in Kolkata.</span><span>Free data from OpenStreetMap contributors.</span></footer>
    </div>
  )
}

function InfoPage() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 py-16 lg:px-10 lg:py-24">
      <span className="inline-flex items-center gap-2 rounded-full bg-[#fbf1e6] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-terracotta"><Route className="h-3.5 w-3.5" /> How it works</span>
      <h1 className="mt-5 max-w-2xl font-serif text-5xl leading-none tracking-[-0.04em] text-espresso sm:text-7xl">Your next great cup is three steps away.</h1>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {[
          ['01', 'Search your way', 'Look up a neighbourhood, café name, or the kind of workday you are planning.'],
          ['02', 'Filter the details', 'Narrow it down by Wi‑Fi, power outlets, opening hours, and price.'],
          ['03', 'Save your corners', 'Heart the spots you love and keep your personal Kolkata coffee map close.'],
        ].map(([number, title, text]) => <div key={number} className="rounded-2xl border border-[#e7e0d7] bg-white p-7 shadow-sm"><span className="font-serif text-4xl text-terracotta">{number}</span><h2 className="mt-8 font-serif text-2xl text-espresso">{title}</h2><p className="mt-3 text-sm leading-6 text-[#706a62]">{text}</p></div>)}
      </div>
    </section>
  )
}

function AboutPage() {
  return (
    <section className="mx-auto max-w-[900px] px-5 py-16 lg:px-10 lg:py-24">
      <span className="inline-flex items-center gap-2 rounded-full bg-[#edf2eb] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sage"><Info className="h-3.5 w-3.5" /> About bean there</span>
      <h1 className="mt-5 font-serif text-5xl leading-none tracking-[-0.04em] text-espresso sm:text-7xl">A softer way to<br /><em className="font-normal text-terracotta">find coffee.</em></h1>
      <p className="mt-8 max-w-2xl text-lg leading-8 text-[#706a62]">Bean There is a small, friendly guide for Kolkata coffee people. We bring together live OpenStreetMap café data and useful details like Wi‑Fi, power, price, and neighbourhood so choosing a table feels effortless.</p>
      <div className="mt-10 rounded-2xl bg-espresso p-7 text-[#f5e9de] sm:p-10"><h2 className="font-serif text-3xl">Built for the city&apos;s everyday rituals.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#d9c9bd]">From a quick cup near Park Street to a long afternoon in Salt Lake, there is always another corner to discover.</p></div>
    </section>
  )
}

function FavoritesPage({ cafes, onFavorite }) {
  return (
    <section className="mx-auto max-w-[1100px] px-5 py-16 lg:px-10 lg:py-24">
      <span className="inline-flex items-center gap-2 rounded-full bg-[#fff0eb] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-terracotta"><Heart className="h-3.5 w-3.5" /> Your saved cafés</span>
      <h1 className="mt-5 font-serif text-5xl tracking-[-0.04em] text-espresso">Your coffee shortlist.</h1>
      {!cafes.length ? <div className="mt-10 rounded-2xl border border-dashed border-[#d8d0c5] bg-white p-12 text-center"><Coffee className="mx-auto h-8 w-8 text-[#c5b9aa]" /><p className="mt-3 font-serif text-xl text-espresso">Nothing saved yet</p><p className="mt-1 text-sm text-[#999087]">Head to Discover and tap the heart on a café you love.</p></div> : <div className="mt-10 grid gap-4 md:grid-cols-2">{cafes.map((cafe) => <CafeCard key={cafe.id} cafe={cafe} favorite onFavorite={() => onFavorite(cafe.id)} />)}</div>}
    </section>
  )
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Your password should be at least 6 characters.')
      return
    }
    onLogin()
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#f5efe6] text-ink">
      <div className="hidden w-[43%] flex-col justify-between bg-espresso p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f5d8a8] text-xl text-espresso">☕</span>
          <span className="font-display text-xl font-bold tracking-[-0.04em]">bean there<span className="text-[#ed956d]">.</span></span>
        </div>
        <div className="relative z-10 max-w-md">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#f5d8a8]"><Sparkles className="h-3.5 w-3.5" /> Kolkata&apos;s coffee map</span>
          <h1 className="font-serif text-6xl leading-[0.98] tracking-[-0.04em]">Good coffee<br /><em className="font-normal text-[#ed956d]">finds you.</em></h1>
          <p className="mt-6 max-w-sm text-base leading-7 text-[#d9c9bd]">Save your favourite corners, discover new neighbourhoods, and always know where your next cup is waiting.</p>
        </div>
        <p className="text-xs text-[#b8a79c]">Made for slow mornings and bright ideas.</p>
      </div>

      <div className="flex w-full items-center justify-center px-5 py-10 sm:px-10 lg:w-[57%]">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-espresso text-xl text-[#f5d8a8]">☕</span>
            <span className="font-display text-xl font-bold tracking-[-0.04em]">bean there<span className="text-terracotta">.</span></span>
          </div>
          <div className="mb-8">
            <p className="mb-3 text-sm font-bold text-terracotta">Welcome back</p>
            <h2 className="font-serif text-4xl tracking-[-0.03em] text-espresso sm:text-5xl">Let&apos;s find your<br />next favourite café.</h2>
            <p className="mt-4 text-sm leading-6 text-[#81796f]">Sign in to save cafés and make your coffee map personal.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-[#706a62]">Email address</span>
              <span className="flex h-14 items-center gap-3 rounded-xl border border-[#ded4c8] bg-white px-4 transition focus-within:border-terracotta focus-within:ring-4 focus-within:ring-[#c96743]/10">
                <Mail className="h-4 w-4 text-[#a3988c]" />
                <input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} placeholder="you@example.com" className="w-full bg-transparent text-sm outline-none placeholder:text-[#b5aca3]" />
              </span>
            </label>
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.1em] text-[#706a62]"><span>Password</span><button type="button" className="normal-case tracking-normal text-terracotta">Forgot password?</button></span>
              <span className="flex h-14 items-center gap-3 rounded-xl border border-[#ded4c8] bg-white px-4 transition focus-within:border-terracotta focus-within:ring-4 focus-within:ring-[#c96743]/10">
                <LockKeyhole className="h-4 w-4 text-[#a3988c]" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} placeholder="••••••••" className="w-full bg-transparent text-sm outline-none placeholder:text-[#b5aca3]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="text-[#a3988c]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </span>
            </label>
            {error && <p className="rounded-lg bg-[#fff0eb] px-3 py-2 text-xs font-semibold text-[#b34f32]">{error}</p>}
            <button type="submit" className="h-14 w-full rounded-xl bg-espresso text-sm font-bold text-white shadow-lg shadow-espresso/10 transition hover:bg-[#55382e]">Sign in to explore <ArrowUpRight className="ml-1 inline h-4 w-4" /></button>
          </form>
          <div className="my-7 flex items-center gap-3 text-xs text-[#aaa096]"><span className="h-px flex-1 bg-[#ded4c8]" /> or <span className="h-px flex-1 bg-[#ded4c8]" /></div>
          <button onClick={onLogin} className="h-14 w-full rounded-xl border border-[#d8cfc4] bg-white text-sm font-bold text-espresso transition hover:border-espresso">Continue as a guest</button>
          <p className="mt-7 text-center text-xs leading-5 text-[#a3988c]">By continuing, you agree to our Terms and Privacy Policy.</p>
        </div>
      </div>
    </div>
  )
}

function CafeCard({ cafe, favorite, onFavorite }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#e7e0d7] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className={`relative h-32 bg-gradient-to-br ${cafe.accent}`}>
        <div className="absolute -bottom-7 left-5 grid h-14 w-14 place-items-center rounded-2xl border-4 border-white bg-espresso text-2xl shadow-md">☕</div>
        <button onClick={onFavorite} aria-label={favorite ? `Remove ${cafe.name} from favorites` : `Save ${cafe.name}`} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/75 text-espresso backdrop-blur transition hover:bg-white"><Heart className={`h-4 w-4 ${favorite ? 'fill-terracotta text-terracotta' : ''}`} /></button>
        <span className="absolute bottom-3 right-4 rounded-full bg-white/85 px-2 py-1 text-xs font-bold text-espresso">{cafe.priceLabel}</span>
      </div>
      <div className="p-5 pt-10">
        <div className="flex items-start justify-between gap-2"><div><h3 className="font-serif text-xl text-espresso">{cafe.name}</h3><p className="mt-0.5 text-xs font-semibold text-[#999087]">{cafe.area}</p></div><span className="flex items-center gap-1 text-xs font-bold text-espresso">★ {cafe.rating}</span></div>
        <p className="mt-3 min-h-[40px] text-sm leading-5 text-[#706a62]">{cafe.note}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">{cafe.tags.map((tag) => <span key={tag} className="rounded-full bg-[#f4f1ed] px-2 py-1 text-[10px] font-bold text-[#81796f]">{tag}</span>)}</div>
        <div className="mt-5 flex items-center justify-between border-t border-[#eee9e2] pt-4 text-xs">
          <div className="flex items-center gap-2">{cafe.wifi && <span className="flex items-center gap-1 font-bold text-sage"><Wifi className="h-3.5 w-3.5" /> Wi‑Fi</span>}{cafe.power && <span className="flex items-center gap-1 font-bold text-sage"><Zap className="h-3.5 w-3.5" /> Power</span>}</div>
          <span className="text-[#999087]">{cafe.hours.replace('Open until ', 'Until ')}</span>
        </div>
      </div>
    </article>
  )
}
