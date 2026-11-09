// Destination guides shown under Blogs. Add a guide by adding an entry; `city` links it to the
// stays in that town (and supplies its cover photo from those stays).

export interface Guide {
  slug: string;
  city: string;
  title: string;
  summary: string;
  updated: string;
  sections: { heading: string; paragraphs?: string[]; points?: string[] }[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'kasauli-weekend-guide',
    city: 'Kasauli',
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
    city: 'Mussoorie',
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
];
