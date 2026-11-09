// Posts shown under Blogs. Add one by adding an entry. A post with `city` links to the stays in
// that town and uses one of their photos as its cover; others borrow a photo from any live stay.

export type GuideTag = 'Destination guide' | 'Trip planning' | 'Travel tips';

export interface Guide {
  slug: string;
  tag: GuideTag;
  city?: string;
  /** Cover photo for posts that aren't about one town */
  cover?: string;
  readMinutes: number;
  title: string;
  summary: string;
  updated: string;
  sections: { heading: string; paragraphs?: string[]; points?: string[] }[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'kasauli-weekend-guide',
    tag: 'Destination guide',
    city: 'Kasauli',
    readMinutes: 4,
    title: 'A slow weekend in Kasauli',
    summary:
      'Pine-scented walks, colonial lanes and big sunsets, a short drive from Chandigarh. What to see, when to go and how to get there.',
    updated: 'November 2026',
    sections: [
      {
        heading: 'Why Kasauli',
        paragraphs: [
          'Kasauli is a small cantonment town in Himachal Pradesh, at a little under 2,000 metres. It has none of the traffic of the bigger hill stations: just quiet roads, pine and oak forest, old stone churches and wide views over the plains.',
          'It is close enough to Chandigarh for a weekend, but calm enough to feel far away.',
        ],
      },
      {
        heading: 'Getting there',
        points: [
          'By road: about 65 km from Chandigarh, usually around two hours, via the Kalka–Shimla highway and the turn at Dharampur.',
          'By train: Kalka is the nearest major railway station, about an hour away by taxi.',
          'By air: Chandigarh airport is the closest, around two hours by road.',
        ],
      },
      {
        heading: 'Things to do',
        points: [
          'Walk the Mall Road and the Lower Mall, with old bakeries and quiet cafés.',
          'Visit Christ Church, a stone church from the 1850s with lovely stained glass.',
          'Take the Gilbert Trail, an easy forest walk with views over the valley.',
          'Catch the sunset from Sunset Point; on clear evenings you can see the lights of the plains come on.',
          'Monkey Point has a small Hanuman temple inside an Air Force area: carry ID, and phones and cameras are not allowed.',
        ],
      },
      {
        heading: 'When to go',
        points: [
          'March to June: pleasant days and cool evenings, the most popular season.',
          'October and November: clear skies and crisp air, our favourite time.',
          'December to February: cold, with the odd snowfall. Ask us about heating when you book.',
          'July to September: monsoon. Green and misty, but roads can be slow after heavy rain.',
        ],
      },
      {
        heading: 'Good to know',
        paragraphs: [
          'Evenings get cold even in summer, so pack a warm layer. Weekends and long holidays fill up early; book a couple of weeks ahead if you can.',
        ],
      },
    ],
  },
  {
    slug: 'mussoorie-guide',
    tag: 'Destination guide',
    city: 'Mussoorie',
    readMinutes: 4,
    title: 'Mussoorie beyond the Mall Road',
    summary:
      "The Queen of the Hills, the quieter way: Landour's lanes, Himalayan views and where to go when the Mall gets busy.",
    updated: 'November 2026',
    sections: [
      {
        heading: 'Why Mussoorie',
        paragraphs: [
          "Mussoorie sits at about 2,000 metres above Dehradun in Uttarakhand, with views of the snow peaks on clear days. The Mall Road is lively, but a short walk up to Landour or along Camel's Back Road and it is quiet again.",
        ],
      },
      {
        heading: 'Getting there',
        points: [
          'By road: about 35 km from Dehradun, roughly an hour and a half up the hill; around 6 to 7 hours from Delhi.',
          'By train: Dehradun station has direct trains from Delhi, including the Shatabdi.',
          'By air: Jolly Grant airport (Dehradun) is the nearest, about 60 km away.',
        ],
      },
      {
        heading: 'Things to do',
        points: [
          "Walk up to Landour for Char Dukan's pancakes and maggi, and the view from Lal Tibba.",
          "Stroll Camel's Back Road at sunset, away from the Mall Road crowds.",
          'Ride the ropeway up to Gun Hill for wide views of the Doon valley and the Himalaya.',
          'Visit Kempty Falls, about 15 km away; go early in the day to avoid the crowds.',
          'Spend an unhurried afternoon at Company Garden or browsing the old bookshops on the Mall.',
        ],
      },
      {
        heading: 'When to go',
        points: [
          'March to June: the main season, warm days and cool nights.',
          'September to November: after the rains, clear mountain views and fewer people.',
          'December to February: cold, with snow in some years. Beautiful, but pack properly.',
          'July and August: heavy monsoon rain. Expect mist and the occasional roadblock.',
        ],
      },
      {
        heading: 'Good to know',
        paragraphs: [
          'Traffic into town can be slow on weekends and holidays, so arrive early. Many lanes are steep and walkable only, so comfortable shoes matter more than you think.',
        ],
      },
    ],
  },
  {
    slug: 'villa-or-hotel',
    cover: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1600&auto=format&fit=crop',
    tag: 'Trip planning',
    readMinutes: 3,
    title: 'Villa or hotel? How to choose for your next trip',
    summary:
      'A whole house to yourselves or a room with service on call? A quick way to decide, based on who you are travelling with and what you want from the trip.',
    updated: 'November 2026',
    sections: [
      {
        heading: 'Choose a villa or BnB when…',
        points: [
          "You're a group of friends or two or more families who want to spend time together, not in separate rooms down a corridor.",
          'You want a kitchen, a garden or a terrace, and the freedom to keep your own hours.',
          'You are staying three nights or more. Per person, a villa often works out cheaper than several hotel rooms.',
          'You are bringing young children and want space for them to play and nap.',
        ],
      },
      {
        heading: 'Choose a hotel or resort when…',
        points: [
          "It's a short trip for one or two people and you just want to arrive and relax.",
          'You want daily housekeeping, a restaurant on site and someone at the front desk at any hour.',
          'You are planning to be out exploring all day and only need a comfortable base.',
        ],
      },
      {
        heading: 'Questions worth asking before you book',
        points: [
          'Is there a caretaker or cook, and are meals included or charged separately?',
          'How is the property heated in winter, and is there power backup?',
          'How far is the parking from the door? In the hills, the last stretch is often on foot.',
          'What are the check-in and check-out times, and is early check-in possible?',
        ],
        paragraphs: ['Not sure? Send us your dates and group size and we will suggest the right kind of stay.'],
      },
    ],
  },
  {
    slug: 'group-getaway-checklist',
    cover: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop',
    tag: 'Trip planning',
    readMinutes: 4,
    title: 'Planning a group getaway to the hills: a simple checklist',
    summary:
      'Birthdays, reunions, a long weekend with old friends. How to plan a group trip without the endless WhatsApp thread.',
    updated: 'November 2026',
    sections: [
      {
        heading: 'Four to six weeks before',
        points: [
          'Fix the dates first, then the place. Long weekends and holidays fill up fast.',
          'Agree on a budget per person, including travel, the stay and food.',
          'Count heads honestly, including children. Properties have a maximum guest count for good reasons.',
          "Shortlist two or three stays that sleep your whole group, and send one booking request with everyone's needs.",
        ],
      },
      {
        heading: 'Two weeks before',
        points: [
          'Confirm who is driving and who is coming by train or bus, and share pick-up points.',
          "Tell the property about food preferences, a cake or bonfire night, and anyone's special needs.",
          "Collect everyone's share of the payment before the due date, not on the way up.",
        ],
      },
      {
        heading: 'The week of the trip',
        points: [
          'Check the weather and road conditions, especially in monsoon and winter.',
          'Make sure each adult carries a government photo ID; properties are required to register guests.',
          "Share the property location and the host's number with the whole group.",
          'Leave early. Hill roads are slow, and arriving before dark makes the last stretch easier.',
        ],
      },
      {
        heading: 'House etiquette',
        paragraphs: [
          'Keep the music down after 10 pm, respect the neighbours and the house rules, and leave the place as you found it. Hosts remember good guests, and it makes the next booking easier for everyone.',
        ],
      },
    ],
  },
  {
    slug: 'packing-for-the-hills',
    cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop',
    tag: 'Travel tips',
    readMinutes: 3,
    title: 'What to pack for the hills, season by season',
    summary:
      'Hill weather changes fast. A short packing list for summer, monsoon and winter trips to the mountains, so you stay warm, dry and comfortable.',
    updated: 'November 2026',
    sections: [
      {
        heading: 'Every trip',
        points: [
          'A warm layer for the evenings: even in May, nights in the hills can be cool.',
          'Comfortable shoes with good grip. Many hill-town lanes are steep, and some are walk-only.',
          'Sunscreen and sunglasses; the sun is stronger at altitude.',
          'Basic medicines, including something for motion sickness on winding roads.',
          'A power bank, and some cash for small shops and roadside stalls.',
        ],
      },
      {
        heading: 'Summer (March to June)',
        points: ['Light cotton clothes for the day, a fleece or light jacket for the night.', 'A cap or hat for walks in the sun.'],
      },
      {
        heading: 'Monsoon (July to September)',
        points: [
          'A proper rain jacket or poncho, and an umbrella.',
          'Quick-dry clothes and a spare pair of shoes.',
          'Waterproof covers or zip bags for phones and documents.',
          'Extra time in your plans: landslides can close roads for a few hours.',
        ],
      },
      {
        heading: 'Winter (December to February)',
        points: [
          'Thermal innerwear, a heavy jacket, a cap, gloves and woollen socks.',
          'Moisturiser and lip balm; the cold air is very dry.',
          "If you're driving, check whether snow chains are needed and drive only in daylight.",
          'Ask the property about room heating and hot water before you go.',
        ],
      },
    ],
  },
  {
    slug: 'weekend-getaways-from-delhi-chandigarh',
    cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1600&auto=format&fit=crop',
    tag: 'Trip planning',
    readMinutes: 3,
    title: 'Hill weekends from Delhi and Chandigarh',
    summary:
      'Two days off and a car? Hill getaways that work for a weekend, and how to make the most of a short trip.',
    updated: 'November 2026',
    sections: [
      {
        heading: 'From Chandigarh',
        points: [
          'Kasauli: about two hours. Quiet cantonment lanes, forest walks and big sunsets. Perfect for a Saturday–Sunday break.',
          'The Shimla side (Waknaghat, Kandaghat): a little further along the same highway, with valley views and easy access to Shimla.',
        ],
      },
      {
        heading: 'From Delhi',
        points: [
          'Mussoorie: around six to seven hours by road, or the morning train to Dehradun and an hour and a half up the hill. Best with a Friday off.',
          'Kasauli: around six hours by road via Chandigarh, or the train to Kalka and a short drive up.',
        ],
      },
      {
        heading: 'Making a short trip count',
        points: [
          'Leave very early on day one, or the night before, to beat the traffic out of the city.',
          'Pick one or two things to do, not ten. The best part of the hills is slowing down.',
          'Stay somewhere with a view and a good breakfast; you will spend more time there than you think.',
          'Head back after an early lunch on the last day to avoid the Sunday-evening rush.',
        ],
        paragraphs: ['Read our Kasauli and Mussoorie guides for more, or ask us to suggest a stay for your dates.'],
      },
    ],
  },
];
