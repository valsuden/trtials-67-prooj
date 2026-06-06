// Bloque: Datos de Banners
const BANNERS = [
  { id:'lava_core',       name:'Lava Core',        rarity:'Legendary', price:420,  css:'bn-lava',      theme:'magma / fuego / grietas' },
  { id:'sky_temple',      name:'Sky Temple',        rarity:'Epic',      price:260,  css:'bn-sky',       theme:'cielo / energía divina' },
  { id:'neo_street',      name:'Neo Street',        rarity:'Rare',      price:140,  css:'bn-neo',       theme:'grafiti / neon / cyberpunk' },
  { id:'frozen_crown',    name:'Frozen Crown',      rarity:'Epic',      price:280,  css:'bn-ice',       theme:'hielo / viento helado' },
  { id:'void_eclipse',    name:'Void Eclipse',      rarity:'Mythic',    price:700,  css:'bn-void',      theme:'galaxias / distorsión espacial' },
  { id:'hacker_matrix',   name:'Hacker Matrix',     rarity:'Secret',    price:999,  css:'bn-matrix',    theme:'lluvia matrix / binarios / glitch' },
  { id:'toxic_reactor',   name:'Toxic Reactor',     rarity:'Legendary', price:500,  css:'bn-toxic',     theme:'radiación / verde tóxico' },
  { id:'crimson_samurai', name:'Crimson Samurai',   rarity:'Mythic',    price:750,  css:'bn-samurai',   theme:'katana / pétalos rojos' },
  { id:'deep_ocean',      name:'Deep Ocean',        rarity:'Epic',      price:320,  css:'bn-ocean',     theme:'océano profundo / medusas' },
  { id:'phantom_pulse',   name:'Phantom Pulse',     rarity:'Secret',    price:850,  css:'bn-phantom',   theme:'fantasmas / energía oscura' },
  { id:'celestial_king',  name:'Celestial King',    rarity:'Divine',    price:1200, css:'bn-divine',    theme:'oro / constelaciones / rayos' },
  { id:'digital_overdrive',name:'Digital Overdrive',rarity:'Mythic',   price:880,  css:'bn-digital',   theme:'RGB / hologramas' },
  { id:'blood_moon',      name:'Blood Moon',        rarity:'Legendary', price:600,  css:'bn-moon',      theme:'luna roja / eclipse / niebla' },
  { id:'neon_velocity',   name:'Neon Velocity',     rarity:'Epic',      price:350,  css:'bn-velocity',  theme:'velocidad / trails neon' },
  { id:'ancient_rune',    name:'Ancient Rune',      rarity:'Rare',      price:180,  css:'bn-rune',      theme:'runas mágicas / símbolos' },
  { id:'thunder_rift',    name:'Thunder Rift',      rarity:'Epic',      price:310,  css:'bn-thunder',   theme:'rayo / tormenta eléctrica' },
  { id:'crystal_peak',    name:'Crystal Peak',      rarity:'Rare',      price:200,  css:'bn-crystal',   theme:'cristal / transparencia' },
  { id:'solar_bloom',     name:'Solar Bloom',       rarity:'Uncommon',  price:90,   css:'bn-solar',     theme:'sol / naranja / calor' },
  { id:'moonlight_guard', name:'Moonlight Guard',   rarity:'Rare',      price:220,  css:'bn-moonlight', theme:'luna llena / guardia nocturno' },
  { id:'urban_shadow',    name:'Urban Shadow',      rarity:'Uncommon',  price:100,  css:'bn-urban',     theme:'sombra / ciudad / nocturno' },
  { id:'galactic_arc',    name:'Galactic Arc',      rarity:'Legendary', price:550,  css:'bn-galactic',  theme:'arco galáctico / nebulosas' },
  { id:'portal_flux',     name:'Portal Flux',       rarity:'Mythic',    price:800,  css:'bn-portal',    theme:'portal / dimensiones' },
  { id:'royal_zenith',    name:'Royal Zenith',      rarity:'Divine',    price:1500, css:'bn-royal',     theme:'corona / poder supremo' },
  { id:'night_circuit',   name:'Night Circuit',     rarity:'Rare',      price:160,  css:'bn-circuit',   theme:'circuito / tecnología oscura' },
];

const RARITY = {
  Common:    { color:'#aaa',    glow:'#aaa' },
  Uncommon:  { color:'#00ff4c', glow:'#00ff4c' },
  Rare:      { color:'#00ccff', glow:'#00ccff' },
  Epic:      { color:'#aa00ff', glow:'#aa00ff' },
  Legendary: { color:'#ff6600', glow:'#ff6600' },
  Mythic:    { color:'#ff2222', glow:'#ff0000' },
  Secret:    { color:'#00ff00', glow:'#00ff00', rainbow:true },
  Divine:    { color:'#ffd700', glow:'#ffd700', divine:true }
};

function getBanner(id) { return BANNERS.find(b => b.id === id); }
function getRarity(r)  { return RARITY[r] || RARITY.Common; }
