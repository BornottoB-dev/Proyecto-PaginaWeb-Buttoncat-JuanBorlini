import type { Product } from '../types/types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    categoryId: 'cat-2',
    category: 'STICKERS',
    vibeIds: ['vibe-3', 'vibe-4'],
    vibe: ['KAWAII', 'PUNK'],
    name: 'STICKER DINOSAURIO DE GOOGLE',
    price: 12.00,
    originalPrice: 16.00,
    image: 'https://i.pinimg.com/736x/4c/33/93/4c3393933d0b563b5d66a824318716e0.jpg',
    badge: '¡NUEVO!',
    badgeBg: 'bg-brand-orange text-white',
    description: 'Sticker de calidad premium resistente al agua.',
    isCustomizable: true,
    stock: 25,
    rating: 4.8,
    reviewsCount: 4,
    reviews: [
      {
        id: 'rev-101',
        userName: 'Martina Gómez',
        rating: 5,
        date: '22/09/2026',
        comment: '¡Me encantó la calidad del sticker! Quedó genial en mi notebook y resiste súper bien el agua y el uso cotidiano.'
      },
      {
        id: 'rev-102',
        userName: 'Lucas Pereyra',
        rating: 5,
        date: '18/09/2026',
        comment: 'El diseño del dinosaurio pixelado es brutal. El envío fue rapidísimo y la presentación en el sobre neobrutalista suma 100 puntos.'
      },
      {
        id: 'rev-103',
        userName: 'Sofía Rossi',
        rating: 4,
        date: '10/09/2026',
        comment: 'Muy buena adherencia y el color es bien vibrante. Definitivamente voy a comprar más pegatinas de la marca.'
      },
      {
        id: 'rev-104',
        userName: 'Ignacio Varela',
        rating: 5,
        date: '02/09/2026',
        comment: 'Un clásico infaltable en cualquier compo o termo. 10/10.'
      }
    ]
  },
  {
    id: 'prod-2',
    categoryId: 'cat-4',
    category: 'PINES',
    vibeIds: ['vibe-1', 'vibe-4'],
    vibe: ['GOTH', 'PUNK'],
    name: 'PINES MEMES',
    price: 10.50,
    image: 'https://i.pinimg.com/1200x/61/ac/ff/61acff8ae3a2aecfaa4c058fe6230d0c.jpg',
    description: 'Pines de aleación metálica.',
    isCustomizable: true,
    stock: 40,
    rating: 4.7,
    reviewsCount: 3,
    reviews: [
      {
        id: 'rev-201',
        userName: 'Camila Torres',
        rating: 5,
        date: '25/09/2026',
        comment: 'Los detalles metálicos están impecables. El agarre doble es súper firme, no se cae de la mochila para nada.'
      },
      {
        id: 'rev-202',
        userName: 'Agustín Fernández',
        rating: 4,
        date: '15/09/2026',
        comment: 'Muy divertidos los modelos de memes. Excelente relación precio-calidad.'
      },
      {
        id: 'rev-203',
        userName: 'Valentina Rios',
        rating: 5,
        date: '05/09/2026',
        comment: 'Quedan geniales enganchados en camperas de jean. Recomiendo totalmente.'
      }
    ]
  },
  {
    id: 'prod-3',
    categoryId: 'cat-5',
    category: 'ARITOS',
    vibeIds: ['vibe-5', 'vibe-6'],
    vibe: ['ROCK', 'NEÓN'],
    name: 'ARITOS PENDIENTES RAYO',
    price: 14.00,
    originalPrice: 18.00,
    image: 'https://butt0ncat.carrd.co/assets/images/gallery08/2f40493e.jpg?v=b4f0619d',
    badge: '-20%',
    badgeBg: 'bg-brand-pink text-white',
    description: 'Aros de acero quirúrgico de rayos holograficos.',
    isCustomizable: false,
    stock: 12,
    rating: 5.0,
    reviewsCount: 2,
    reviews: [
      {
        id: 'rev-301',
        userName: 'Florencia Benitez',
        rating: 5,
        date: '27/09/2026',
        comment: 'Son súper livianos y el efecto holográfico al sol es una locura de lindo. Hipoalergénicos reales.'
      },
      {
        id: 'rev-302',
        userName: 'Mateo Silva',
        rating: 5,
        date: '20/09/2026',
        comment: 'Fue un regalo para mi pareja y le fascinaron. Llegaron súper bien empacados.'
      }
    ]
  },
  {
    id: 'prod-4',
    categoryId: 'cat-1',
    category: 'LLAVEROS / PELUCHES',
    vibeIds: ['vibe-1', 'vibe-3'],
    vibe: ['GOTH', 'KAWAII'],
    name: 'PELUCHES OSITOS DEL AMOR',
    price: 24.99,
    image: 'https://buttoncat.carrd.co/assets/images/gallery01/d9d12246.jpg?v=c28e0fee',
    description: 'Peluche artesanal de confección única. Pieza irrepetible fabricada a mano en Buttoncat Studio.',
    isCustomizable: false,
    stock: 1,
    isUnique: true,
    rating: 5.0,
    reviewsCount: 3,
    reviews: [
      {
        id: 'rev-401',
        userName: 'Carolina Méndez',
        rating: 5,
        date: '24/09/2026',
        comment: 'Se nota el amor y el trabajo artesanal en cada costura. Es una belleza total de colección.'
      },
      {
        id: 'rev-402',
        userName: 'Esteban Ortiz',
        rating: 5,
        date: '12/09/2026',
        comment: 'Suave, único e inigualable. Buttoncat nunca decepciona con sus creaciones hechas a mano.'
      },
      {
        id: 'rev-403',
        userName: 'Lucía Morales',
        rating: 5,
        date: '01/09/2026',
        comment: 'Hermoso en vivo y en directo, las fotos no le hacen justicia a la textura.'
      }
    ]
  },
  {
    id: 'prod-5',
    categoryId: 'cat-3',
    category: 'POSTERS',
    vibeIds: ['vibe-2', 'vibe-6'],
    vibe: ['Y2K', 'NEÓN'],
    name: 'POSTER ARTWORK CYBERPUNK',
    price: 18.00,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop',
    badge: 'TOP SALES',
    badgeBg: 'bg-brand-yellow text-black',
    description: 'Poster ilustración original en papel de alta calidad 300g con acabado mate brutalist.',
    isCustomizable: true,
    stock: 30,
    rating: 4.7,
    reviewsCount: 3,
    reviews: [
      {
        id: 'rev-501',
        userName: 'Gonzalo Ruiz',
        rating: 5,
        date: '26/09/2026',
        comment: 'El papel es bien grueso (300g real) y los colores son ultra intensos. Quedó genial enmarcado.'
      },
      {
        id: 'rev-502',
        userName: 'Melisa Castro',
        rating: 5,
        date: '19/09/2026',
        comment: 'Vino super protegido en tubo rígido para que no se doble. 10 puntos.'
      },
      {
        id: 'rev-503',
        userName: 'Tomas Paez',
        rating: 4,
        date: '14/09/2026',
        comment: 'Hermosa ilustración cyberpunk. Queda muy fachero en mi habitación.'
      }
    ]
  },
  {
    id: 'prod-6',
    categoryId: 'cat-6',
    category: 'COLLARES',
    vibeIds: ['vibe-1', 'vibe-5'],
    vibe: ['GOTH', 'ROCK'],
    name: 'COLLAR CHAINS & CHARMS',
    price: 25.00,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
    description: 'Juego de collares de capas múltiples en plateado oxidado con dijes variados.',
    isCustomizable: true,
    stock: 10,
    rating: 5.0,
    reviewsCount: 2,
    reviews: [
      {
        id: 'rev-601',
        userName: 'Romina Vega',
        rating: 5,
        date: '28/09/2026',
        comment: 'Tiene un peso y presencia tremenda. Los dijes están súper bien terminados.'
      },
      {
        id: 'rev-602',
        userName: 'Joaquín Navarro',
        rating: 5,
        date: '21/09/2026',
        comment: 'Muy estético, la combinación de cadenas de diferentes grosores queda genial.'
      }
    ]
  },
  {
    id: 'prod-7',
    categoryId: 'cat-7',
    category: 'REMERAS',
    vibeIds: ['vibe-4', 'vibe-2'],
    vibe: ['PUNK', 'Y2K'],
    name: 'REMERA BUTTONCAT OVERSIZED',
    price: 32.00,
    originalPrice: 42.00,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop',
    badge: '-24%',
    badgeBg: 'bg-brand-pink text-white',
    description: 'Remera 100% algodón peinado con estampado serigráfico de alta densidad.',
    isCustomizable: true,
    stock: 20,
    rating: 4.5,
    reviewsCount: 2,
    reviews: [
      {
        id: 'rev-701',
        userName: 'Nicolás Cabrera',
        rating: 5,
        date: '23/09/2026',
        comment: 'El calce oversized es perfecto y la tela es algodón de verdad pesadito. No encogió al lavar.'
      },
      {
        id: 'rev-702',
        userName: 'Brenda Alvarez',
        rating: 4,
        date: '17/09/2026',
        comment: 'La estampa serigráfica se siente súper suave al tacto y no agrieta.'
      }
    ]
  },
  {
    id: 'prod-8',
    categoryId: 'cat-8',
    category: 'PINTURAS',
    vibeIds: ['vibe-1', 'vibe-6'],
    vibe: ['GOTH', 'NEÓN'],
    name: 'PINTURA EN LIENZO VOID CAT',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
    badge: 'OBRA ÚNICA',
    badgeBg: 'bg-brand-purple text-white',
    description: 'Obra original pintada a mano en lienzo con acrílicos neón y relieves texturizados.',
    isCustomizable: false,
    stock: 1,
    isUnique: true,
    rating: 5.0,
    reviewsCount: 1,
    reviews: [
      {
        id: 'rev-801',
        userName: 'Sebastián Domínguez',
        rating: 5,
        date: '15/09/2026',
        comment: 'Una obra de arte increíble. Bajo la luz UV resalta muchísimo más. Valen cada centavo.'
      }
    ]
  },
  {
    id: 'prod-9',
    categoryId: 'cat-2',
    category: 'STICKERS',
    vibeIds: ['vibe-2', 'vibe-6'],
    vibe: ['Y2K', 'NEÓN'],
    name: 'PACK STICKERS HOLOGRÁFICOS Y2K',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?q=80&w=600&auto=format&fit=crop',
    badge: 'HOLO',
    badgeBg: 'bg-brand-pink text-white',
    description: 'Colección de calcos holográficas vinílicas súper resistentes al agua y rayones.',
    isCustomizable: true,
    stock: 35,
    rating: 5.0,
    reviewsCount: 1,
    reviews: [
      {
        id: 'rev-901',
        userName: 'Daniela Flores',
        rating: 5,
        date: '20/09/2026',
        comment: 'Los reflejos del holograma cambian de color según el ángulo, hermoso pack.'
      }
    ]
  },
  {
    id: 'prod-10',
    categoryId: 'cat-4',
    category: 'PINES',
    vibeIds: ['vibe-4', 'vibe-6'],
    vibe: ['PUNK', 'NEÓN'],
    name: 'PIN NEÓN SKULL PUNK',
    price: 11.50,
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop',
    description: 'Pin metálico esmaltado con tonos neón brillantes y doble broche de mariposa.',
    isCustomizable: true,
    stock: 50,
    rating: 5.0,
    reviewsCount: 1,
    reviews: [
      {
        id: 'rev-1001',
        userName: 'Franco Medina',
        rating: 5,
        date: '22/09/2026',
        comment: 'Esmaltado impecable sin rebabas ni imperfecciones.'
      }
    ]
  },
  {
    id: 'prod-11',
    categoryId: 'cat-5',
    category: 'ARITOS',
    vibeIds: ['vibe-1', 'vibe-5'],
    vibe: ['GOTH', 'ROCK'],
    name: 'ARITOS ARGOLLAS GOTHIC MOON',
    price: 16.00,
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=600&auto=format&fit=crop',
    badge: 'POPULAR',
    badgeBg: 'bg-brand-yellow text-black',
    description: 'Argollas hipoalergénicas en tono negro mate con dijes de luna mística tallados.',
    isCustomizable: false,
    stock: 18,
    rating: 5.0,
    reviewsCount: 1,
    reviews: [
      {
        id: 'rev-1101',
        userName: 'Paula Acosta',
        rating: 5,
        date: '19/09/2026',
        comment: 'El acabado negro mate es súper elegante.'
      }
    ]
  },
  {
    id: 'prod-12',
    categoryId: 'cat-1',
    category: 'LLAVEROS / PELUCHES',
    vibeIds: ['vibe-1', 'vibe-4'],
    vibe: ['GOTH', 'PUNK'],
    name: 'LLAVERO METAL CHARM CAT',
    price: 13.50,
    image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?q=80&w=600&auto=format&fit=crop',
    description: 'Llavero de cadena gruesa con dijes metálicos grabados con el logo icónico de Buttoncat.',
    isCustomizable: true,
    stock: 22,
    rating: 5.0,
    reviewsCount: 1,
    reviews: [
      {
        id: 'rev-1201',
        userName: 'Ezekiel Rios',
        rating: 5,
        date: '11/09/2026',
        comment: 'Cadena pesada y mosquetón resistente.'
      }
    ]
  },
  {
    id: 'prod-13',
    categoryId: 'cat-3',
    category: 'POSTERS',
    vibeIds: ['vibe-2', 'vibe-5'],
    vibe: ['Y2K', 'ROCK'],
    name: 'POSTER RETRO SYNTHWAVE VIBES',
    price: 19.50,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop',
    description: 'Ilustración en papel ilustración matte 300g con colores vibrantes e inalterables.',
    isCustomizable: true,
    stock: 28,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-14',
    categoryId: 'cat-6',
    category: 'COLLARES',
    vibeIds: ['vibe-1', 'vibe-4'],
    vibe: ['GOTH', 'PUNK'],
    name: 'GARGANTILLA CHOKER LEATHER GOTH',
    price: 28.00,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
    description: 'Gargantilla de cuero sintético vegano con hebilla metálica y argolla central.',
    isCustomizable: true,
    stock: 0,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-15',
    categoryId: 'cat-7',
    category: 'REMERAS',
    vibeIds: ['vibe-1', 'vibe-5'],
    vibe: ['GOTH', 'ROCK'],
    name: 'REMERA VINTAGE ACID WASH PUNK',
    price: 34.00,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop',
    description: 'Remera 100% algodón lavado ácido con corte holgado oversized y arte serigrafiado.',
    isCustomizable: true,
    stock: 15,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-16',
    categoryId: 'cat-8',
    category: 'PINTURAS',
    vibeIds: ['vibe-2', 'vibe-6'],
    vibe: ['Y2K', 'NEÓN'],
    name: 'CUADRO ACRÍLICO ABSTRACT NEÓN',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
    badge: 'ARTESANAL',
    badgeBg: 'bg-brand-pink text-white',
    description: 'Lienzo pintado a mano en acrílico con texturas en alto relieve y firma de artista.',
    isCustomizable: false,
    stock: 2,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-17',
    categoryId: 'cat-2',
    category: 'STICKERS',
    vibeIds: ['vibe-1', 'vibe-4'],
    vibe: ['GOTH', 'PUNK'],
    name: 'SET STICKERS DARK SKULLS',
    price: 13.00,
    image: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?q=80&w=600&auto=format&fit=crop',
    description: 'Pack de pegatinas troqueladas vinílicas en tonalidades oscuras y motivos góticos.',
    isCustomizable: true,
    stock: 30,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-18',
    categoryId: 'cat-4',
    category: 'PINES',
    vibeIds: ['vibe-3', 'vibe-2'],
    vibe: ['KAWAII', 'Y2K'],
    name: 'PIN KAWAII CAT BUTTON',
    price: 10.00,
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600&auto=format&fit=crop',
    badge: 'TOP',
    badgeBg: 'bg-brand-yellow text-black',
    description: 'Pin metálico esmaltado con rostro de gatito estilo kawaii y acabado brillante.',
    isCustomizable: true,
    stock: 45,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-19',
    categoryId: 'cat-5',
    category: 'ARITOS',
    vibeIds: ['vibe-4', 'vibe-6'],
    vibe: ['PUNK', 'NEÓN'],
    name: 'ARITOS SPIKES NEÓN PUNK',
    price: 15.50,
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=600&auto=format&fit=crop',
    description: 'Aros con púas y pinchos metálicos inoxidables en acabados neón vibrante.',
    isCustomizable: false,
    stock: 20,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-20',
    categoryId: 'cat-1',
    category: 'LLAVEROS / PELUCHES',
    vibeIds: ['vibe-3', 'vibe-6'],
    vibe: ['KAWAII', 'NEÓN'],
    name: 'PELUCHE CYBER CAT NEÓN',
    price: 26.50,
    image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?q=80&w=600&auto=format&fit=crop',
    badge: 'NUEVO DROP',
    badgeBg: 'bg-brand-pink text-white',
    description: 'Peluche de edición limitada con bordados neón y felpa extra suave.',
    isCustomizable: false,
    stock: 12,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-21',
    categoryId: 'cat-3',
    category: 'POSTERS',
    vibeIds: ['vibe-1', 'vibe-4'],
    vibe: ['GOTH', 'PUNK'],
    name: 'POSTER ARTWORK DARK FANTASY',
    price: 18.50,
    image: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop',
    description: 'Poster impresión de alta definición en papel pesado 300g estilo gothic brutalist.',
    isCustomizable: true,
    stock: 25,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-22',
    categoryId: 'cat-6',
    category: 'COLLARES',
    vibeIds: ['vibe-2', 'vibe-6'],
    vibe: ['Y2K', 'NEÓN'],
    name: 'COLLAR HEART CRYSTAL Y2K',
    price: 24.00,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop',
    description: 'Cadena plateada con dije de corazón en cristal azul iridiscente.',
    isCustomizable: true,
    stock: 16,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-23',
    categoryId: 'cat-7',
    category: 'REMERAS',
    vibeIds: ['vibe-3', 'vibe-6'],
    vibe: ['KAWAII', 'NEÓN'],
    name: 'REMERA KAWAII CYBERPRINT',
    price: 31.00,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop',
    description: 'Remera 100% algodón orgánico con estampado gráfico neón de alta resistencia.',
    isCustomizable: true,
    stock: 22,
    reviewsCount: 0,
    reviews: []
  },
  {
    id: 'prod-24',
    categoryId: 'cat-8',
    category: 'PINTURAS',
    vibeIds: ['vibe-4', 'vibe-5'],
    vibe: ['PUNK', 'ROCK'],
    name: 'CUADRO ACRÍLICO STREET ART',
    price: 47.50,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
    description: 'Obra pictórica original realizada con sprays y acrílicos en lienzo de tela profesional.',
    isCustomizable: false,
    stock: 4,
    reviewsCount: 0,
    reviews: []
  }
];
