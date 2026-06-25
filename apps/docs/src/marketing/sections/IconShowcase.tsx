import {
  Anchor,
  Award,
  Battery,
  Bell,
  Book,
  Bookmark,
  Brain,
  Briefcase,
  Calendar,
  Camera,
  Cloud,
  Coffee,
  Compass,
  Flag,
  Gift,
  Globe,
  Headphones,
  Heart,
  Home,
  Image,
  Key,
  Leaf,
  Lock,
  Mail,
  Map,
  Moon,
  Music,
  Phone,
  Search,
  Settings,
  Star,
  Sun,
  Tag,
  Umbrella,
  User,
  Wifi,
} from '@cascivo/icons'

// A curated, representative subset — varied domains so the breadth reads
// visually. Tree-shaking keeps the bundle cost to just these glyphs; the full
// ~440-icon catalog lives behind the docs.cascivo.com/icons gallery link.
const ICONS = [
  { Icon: Home, name: 'Home' },
  { Icon: Search, name: 'Search' },
  { Icon: Settings, name: 'Settings' },
  { Icon: Heart, name: 'Heart' },
  { Icon: Star, name: 'Star' },
  { Icon: Bell, name: 'Bell' },
  { Icon: Calendar, name: 'Calendar' },
  { Icon: User, name: 'User' },
  { Icon: Lock, name: 'Lock' },
  { Icon: Globe, name: 'Globe' },
  { Icon: Camera, name: 'Camera' },
  { Icon: Anchor, name: 'Anchor' },
  { Icon: Compass, name: 'Compass' },
  { Icon: Cloud, name: 'Cloud' },
  { Icon: Coffee, name: 'Coffee' },
  { Icon: Map, name: 'Map' },
  { Icon: Music, name: 'Music' },
  { Icon: Phone, name: 'Phone' },
  { Icon: Mail, name: 'Mail' },
  { Icon: Image, name: 'Image' },
  { Icon: Key, name: 'Key' },
  { Icon: Gift, name: 'Gift' },
  { Icon: Award, name: 'Award' },
  { Icon: Battery, name: 'Battery' },
  { Icon: Book, name: 'Book' },
  { Icon: Bookmark, name: 'Bookmark' },
  { Icon: Flag, name: 'Flag' },
  { Icon: Leaf, name: 'Leaf' },
  { Icon: Sun, name: 'Sun' },
  { Icon: Moon, name: 'Moon' },
  { Icon: Umbrella, name: 'Umbrella' },
  { Icon: Wifi, name: 'Wifi' },
  { Icon: Headphones, name: 'Headphones' },
  { Icon: Tag, name: 'Tag' },
  { Icon: Briefcase, name: 'Briefcase' },
  { Icon: Brain, name: 'Brain' },
]

export function IconShowcase() {
  return (
    <section
      id="icons"
      className="icon-showcase section"
      aria-label="Icons showcase"
      data-reveal=""
    >
      <h2>~440 icons. One import. Tree-shakeable.</h2>
      <p className="section-sub">
        <code>@cascivo/icons</code> ships a coherent set of stroked 24×24 <code>currentColor</code>{' '}
        SVGs as individually tree-shakeable named exports — your bundle only pays for what you use.
      </p>

      <ul className="icon-showcase-grid">
        {ICONS.map(({ Icon, name }) => (
          <li key={name} className="icon-showcase-tile">
            <Icon size={24} aria-hidden="true" />
            <span className="icon-showcase-name">{name}</span>
          </li>
        ))}
      </ul>

      <p className="icon-showcase-cta">
        <a href="https://docs.cascivo.com/icons">Browse all ~440 icons in the docs →</a>
      </p>
    </section>
  )
}
