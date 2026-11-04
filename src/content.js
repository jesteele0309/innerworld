// Every word a reader or listener meets in INNERWORLD is written here, by
// hand. Nothing in this file is generated. The only generated thing in the
// app is the painting, and the Make screen says so plainly.
//
// Artwork credits are placeholders until a real public-domain image is chosen
// and its accession details verified. A wrong credit is worse than a visible
// blank, so they stay in brackets.

const placeholderArt = {
  artist: '[ARTIST]',
  title: '[TITLE]',
  year: '[YEAR]',
  museum: '[MUSEUM]',
  alt: 'Placeholder for a public-domain painting chosen for this day.',
};

export const days = [
  {
    id: 'autumn-light',
    question: 'Why does autumn light feel different?',
    pigment: 'yellow-ochre',
    reflect: 'Where did you notice warm light today, and what were you doing?',
    ways: {
      read: {
        title: 'The physics of low sun',
        minutes: 4,
        writer: '[WRITER NAME]',
        art: placeholderArt,
        slides: [
          {
            heading: 'The long way down',
            body: 'When the sun sits low, its light crosses far more atmosphere before it reaches you. Short wavelengths scatter away along that route, and what survives the trip leans gold.',
          },
          {
            heading: 'Why blue leaves first',
            body: 'Air molecules scatter short wavelengths far more strongly than long ones — the effect falls off roughly with the fourth power of wavelength. Blue is scattered out of the beam; red and yellow carry on through.',
          },
          {
            heading: 'The same sun, further away from straight',
            body: 'Nothing about the sun has changed. What changed is the angle, and so the distance light travels through air. Noon in June and five o’clock in October are the same lamp seen down a longer corridor.',
          },
          {
            heading: 'And the leaves are helping',
            body: 'Autumn colour is partly subtraction. As chlorophyll breaks down, carotenoids that were present all along stop being masked. Some species also build fresh red anthocyanins on top.',
          },
          {
            heading: 'What your eye does with it',
            body: 'Your eye adapts to whatever light it has been sitting in, so warm light only reads as warm by comparison. Step from a cool room into late sun and the shift is obvious. Stay in it an hour and it becomes the new neutral.',
          },
          {
            heading: 'So the feeling is real',
            body: 'The light genuinely is different: longer path, fewer short wavelengths, lower angle, more shadow. You are not projecting a mood onto October. You are reading it accurately.',
          },
        ],
      },
      drift: {
        title: 'Drift through amber hours',
        minutes: 9,
        lines: [
          'Put the phone somewhere you can still see the screen, and let your hand rest.',
          'Bring to mind a room you have been in when the light turned gold.',
          'Not a photograph of it. The room itself — the temperature, the sound.',
          'Find the window. Notice which way the light falls across the floor.',
          'Let the edge of that light move, slowly, the way it actually moves.',
          'Something in the room is catching it. A glass, a wall, the back of a chair.',
          'Stay with that one lit thing for a while.',
          'Now let the room go, and keep the colour.',
          'When you are ready, come back to the day you are actually in.',
        ],
      },
      wander: {
        title: 'Find five golds outside',
        minutes: 10,
        steps: [
          'Go outside. Anywhere outside counts — a step, a balcony, a car park.',
          'Find one gold that is lit: something the sun is landing on right now.',
          'Find one gold that is not lit: the same colour, in shade.',
          'Find a gold that is not a leaf.',
          'Find a gold you would not have called gold yesterday.',
          'Find the fifth without looking for it. Wait until it arrives.',
        ],
      },
    },
  },

  {
    id: 'blue-dusk',
    question: 'Where does colour go at dusk?',
    pigment: 'indigo',
    reflect: 'What did the end of today look like, before the lights came on?',
    ways: {
      read: {
        title: 'The hour your eyes change hands',
        minutes: 4,
        writer: '[WRITER NAME]',
        art: placeholderArt,
        slides: [
          {
            heading: 'Two sets of sensors',
            body: 'Your retina carries cones, which need decent light and report colour, and rods, which work in very little light and do not report colour at all.',
          },
          {
            heading: 'The handover',
            body: 'As light drops, cones stop keeping up and rods take over. Colour does not switch off so much as stop being reported.',
          },
          {
            heading: 'Why dusk looks blue',
            body: 'Rods are most sensitive a little further toward the blue end than cones are. So as the handover happens, blues hold their apparent brightness while reds fall away first. Painters knew the effect long before anyone measured it.',
          },
          {
            heading: 'Red goes first',
            body: 'Watch a red object and a blue object of similar brightness as the light fails. The red one darkens faster, and at some point reads as nearly black while the blue still glows.',
          },
          {
            heading: 'Not a defect',
            body: 'Nothing is going wrong. You are watching a system change gears in order to keep seeing at all. The cost of that is colour.',
          },
        ],
      },
      drift: {
        title: 'Let the room go grey',
        minutes: 7,
        lines: [
          'Sit where you are. You do not need to close your eyes.',
          'Pick one coloured thing in front of you and hold it loosely in your attention.',
          'Imagine the light in the room dropping, slowly, over an hour.',
          'The colour of that thing is the first to leave. Let it.',
          'Shapes stay. Edges stay. Weight stays.',
          'Notice that you can still see everything you need to see.',
          'Sit for a moment in a room with no colour in it.',
          'Then let the light come back, at whatever speed it wants.',
        ],
      },
      wander: {
        title: 'Walk until the colour drains',
        minutes: 10,
        steps: [
          'Go out within half an hour of sunset, if you can.',
          'Choose one red thing and one blue thing you can see from your route.',
          'Walk your usual way, and check on both every few minutes.',
          'Notice the moment the red stops being red.',
          'Notice whether the blue has gone with it. Usually it has not.',
          'Head back when you can no longer tell the two apart.',
        ],
      },
    },
  },

  {
    id: 'costly-blue',
    question: 'What did a colour used to cost?',
    pigment: 'ultramarine',
    reflect: 'What are you spending more on than it probably warrants, and is it worth it?',
    ways: {
      read: {
        title: 'Blue, carried overland',
        minutes: 5,
        writer: '[WRITER NAME]',
        art: placeholderArt,
        slides: [
          {
            heading: 'One mountain',
            body: 'For centuries, the best blue available to European painters came from lapis lazuli, and the lapis came from mines in what is now north-eastern Afghanistan.',
          },
          {
            heading: 'Grinding is not enough',
            body: 'Ground lapis alone gives a disappointing grey-blue. Getting a strong colour meant a long extraction — kneading the powder in wax and resin to separate the blue mineral from the rest of the rock.',
          },
          {
            heading: 'Priced like a material, not a colour',
            body: 'The result cost enough that contracts sometimes specified who paid for it, and how much was to be used. The blue in a painting could be a line in a budget.',
          },
          {
            heading: 'So blue meant something',
            body: 'When the most expensive pigment in the box is reserved for one figure or one sky, the choice is visible to anyone who knows the price. Cost became part of the composition.',
          },
          {
            heading: 'Then it stopped costing',
            body: 'A synthetic equivalent arrived in the nineteenth century, after a prize was offered for one. Within a generation the most expensive colour in painting was simply available.',
          },
          {
            heading: 'What scarcity was doing',
            body: 'Nothing about the colour changed when the price fell. What changed was what using it said. Worth noticing which of your own choices are about the thing, and which are about what the thing costs.',
          },
        ],
      },
      drift: {
        title: 'The weight of one colour',
        minutes: 8,
        lines: [
          'Bring to mind the blue of a clear sky at the top of its arc.',
          'Hold just that, with nothing else in the frame.',
          'Now imagine it as a substance. A spoonful of powder.',
          'Imagine carrying it a very long way.',
          'Imagine deciding where, in a whole year of work, to put it.',
          'Choose the place. Do not explain the choice.',
          'Let the colour be ordinary again.',
        ],
      },
      wander: {
        title: 'Count the blues you were given',
        minutes: 8,
        steps: [
          'Walk a route you know well.',
          'Count blues. Signs, bins, coats, screens, paint, sky.',
          'Stop at ten, and look at the tenth properly.',
          'Ask what it would have taken to make that exact blue by hand.',
          'Walk home without counting anything.',
        ],
      },
    },
  },

  {
    id: 'white-lead',
    question: 'Is white a colour or an absence?',
    pigment: 'lead-white',
    reflect: 'What in your life is quietly doing the work that nobody notices?',
    ways: {
      read: {
        title: 'The most used paint in the room',
        minutes: 4,
        writer: '[WRITER NAME]',
        art: placeholderArt,
        slides: [
          {
            heading: 'Made, not found',
            body: 'For most of the history of European painting, white was manufactured: lead was stacked in pots over vinegar and left in gentle heat until a white crust formed on the metal.',
          },
          {
            heading: 'The paint underneath the painting',
            body: 'White does most of the quiet labour in a picture — the ground, the highlights, every colour mixed lighter. By volume it is often the paint used most and noticed least.',
          },
          {
            heading: 'It changes everything it touches',
            body: 'Adding white does not simply lighten a colour; it drains its saturation and shifts how cool it reads. Every tint is a trade.',
          },
          {
            heading: 'It was also poisonous',
            body: 'Lead white handled badly made the people who made it ill, and that was understood long before it was replaced. It stayed in use because nothing else performed as well.',
          },
          {
            heading: 'Not an absence',
            body: 'An absence of paint is bare ground or bare canvas, and it looks nothing like white paint. White is a decision, applied, with a cost.',
          },
        ],
      },
      drift: {
        title: 'A room with nothing added',
        minutes: 6,
        lines: [
          'Picture a plain wall, close enough to touch.',
          'Give it a colour so pale you would call it white.',
          'Now find the places where it is not white. Near the floor. Near the window.',
          'There are four or five different whites on one wall.',
          'Stay with the one furthest from the light.',
          'Let the wall go.',
        ],
      },
      wander: {
        title: 'Collect five whites',
        minutes: 8,
        steps: [
          'Walk until you find a white that is slightly blue.',
          'Then a white that is slightly yellow.',
          'Then a white that is grey and still reads as white.',
          'Then something you would call white that is plainly not.',
          'Then the whitest thing on your route. Stand next to it.',
        ],
      },
    },
  },

  {
    id: 'afterimage',
    question: 'Why do you still see it after you look away?',
    pigment: 'viridian',
    reflect: 'What are you still seeing from earlier today, after it ended?',
    ways: {
      read: {
        title: 'The colour that is not there',
        minutes: 4,
        writer: '[WRITER NAME]',
        art: placeholderArt,
        slides: [
          {
            heading: 'Stare, then look away',
            body: 'Hold your gaze on a saturated red shape for half a minute, then look at a blank wall. A green shape appears, the same size, in the same place.',
          },
          {
            heading: 'Colour is reported in pairs',
            body: 'Early in the visual system, colour is encoded as oppositions — roughly red against green, and blue against yellow. Your brain does not receive a list of colours, it receives balances.',
          },
          {
            heading: 'Hold one side and it tires',
            body: 'Sustained red pushes that channel hard in one direction. Take the red away and the channel settles back past neutral, and the overshoot reads as green.',
          },
          {
            heading: 'Which is why the pairs are fixed',
            body: 'Afterimages are never random. Red gives green, blue gives yellow, black gives white. The pairing tells you how the wiring is arranged.',
          },
          {
            heading: 'Seeing is a rate, not a reading',
            body: 'Your eye reports change far better than it reports steady state. An afterimage is what that trade-off looks like from the inside.',
          },
        ],
      },
      drift: {
        title: 'What stays when you stop looking',
        minutes: 7,
        lines: [
          'Think of the last bright thing you looked at today.',
          'Let it sit in front of you, then take it away.',
          'Notice what is left in the space where it was.',
          'Now do the same with something that happened, not something you saw.',
          'Take the event away and look at the space where it was.',
          'Something is still there. Let it be there without explaining it.',
        ],
      },
      wander: {
        title: 'Walk off an image',
        minutes: 10,
        steps: [
          'Before you leave, look at one bright thing for a slow count of thirty.',
          'Walk out, and notice how long its ghost follows you.',
          'When it has gone, pick something on the route and do it again.',
          'Notice that the ghost is always the opposite colour.',
          'Walk the last few minutes looking at nothing in particular.',
        ],
      },
    },
  },

  {
    id: 'earth-colours',
    question: 'Why is so much old painting the colour of dirt?',
    pigment: 'burnt-umber',
    reflect: 'What have you been making do with, and how is it actually working out?',
    ways: {
      read: {
        title: 'What was lying around',
        minutes: 4,
        writer: '[WRITER NAME]',
        art: placeholderArt,
        slides: [
          {
            heading: 'The oldest paints are soil',
            body: 'Ochres, siennas and umbers are earths coloured by iron. They can be dug, washed, dried and ground, and that is most of the process.',
          },
          {
            heading: 'Roasting changes them',
            body: 'Heat drives water out of the iron compounds and shifts the colour warmer and deeper. Raw sienna becomes burnt sienna; raw umber becomes burnt umber. Same earth, different temperature.',
          },
          {
            heading: 'They are also extremely reliable',
            body: 'Earth pigments are stable in light, mix willingly, and do not react badly with much. Some of the brighter historical colours cannot claim any of that.',
          },
          {
            heading: 'So the palette was partly a supply chain',
            body: 'A painter in a given place had cheap local earths, a few affordable mid-range colours, and one or two they had to justify. The look of a period is partly an inventory.',
          },
          {
            heading: 'Constraint as a style',
            body: 'Narrow palettes tend to hang together. Work made from four earths and a white looks coherent almost by accident — a thing worth remembering when a hundred choices are available.',
          },
        ],
      },
      drift: {
        title: 'Four colours and nothing else',
        minutes: 7,
        lines: [
          'Imagine being handed four colours for the whole year.',
          'A warm earth. A dark earth. A white. One blue.',
          'Picture the first thing you would make.',
          'Now picture the hundredth.',
          'Notice that the hundredth is more interesting than the first.',
          'Put the colours down.',
        ],
      },
      wander: {
        title: 'Find the earths underfoot',
        minutes: 9,
        steps: [
          'Walk somewhere with exposed ground — a path, a verge, a building site.',
          'Find three different colours of actual dirt.',
          'Notice which is closest to the colour of a brick near you.',
          'Find something painted that matches one of them.',
          'Leave the ground where it is.',
        ],
      },
    },
  },

  {
    id: 'one-red',
    question: 'How much red does a picture need?',
    pigment: 'vermilion',
    reflect: 'Where in today did a very small thing carry most of the weight?',
    ways: {
      read: {
        title: 'The argument for almost none',
        minutes: 4,
        writer: '[WRITER NAME]',
        art: placeholderArt,
        slides: [
          {
            heading: 'Saturation is relative',
            body: 'A colour reads as intense in proportion to what surrounds it. The same red is loud among greys and ordinary among reds.',
          },
          {
            heading: 'Area works against intensity',
            body: 'Spread a strong colour over most of a surface and it stops being an event and becomes the ground. Reduce it to a fraction and it becomes the subject.',
          },
          {
            heading: 'Which is why accents are small',
            body: 'A dot of vermilion in a quiet field of earths will pull the eye harder than a whole wall of it. Painters have exploited that for as long as strong reds have been available.',
          },
          {
            heading: 'The same logic outside painting',
            body: 'One sentence in a plain report. One lit window on a dark street. Emphasis is a ratio, and spending it everywhere spends it nowhere.',
          },
          {
            heading: 'Try subtracting instead',
            body: 'When something is not carrying, the useful question is rarely what to add. It is usually what to take out so that what is left can be seen.',
          },
        ],
      },
      drift: {
        title: 'One bright thing',
        minutes: 6,
        lines: [
          'Picture a wide, quiet, almost colourless view.',
          'Place one small red thing in it. Anywhere.',
          'Notice that you cannot look anywhere else.',
          'Now add a second red thing.',
          'Notice what you lost.',
          'Take the second one away.',
        ],
      },
      wander: {
        title: 'Hunt one red',
        minutes: 8,
        steps: [
          'Walk and ignore every red you see until one stops you.',
          'Stand where you can see it and nothing else red.',
          'Work out what it is doing to everything around it.',
          'Walk on, and notice the next place a single colour is carrying a whole view.',
        ],
      },
    },
  },

  {
    id: 'grey-days',
    question: 'What is there to see on a flat grey day?',
    pigment: 'bone-black',
    reflect: 'What did today give you that was not obvious?',
    ways: {
      read: {
        title: 'In praise of no shadows',
        minutes: 4,
        writer: '[WRITER NAME]',
        art: placeholderArt,
        slides: [
          {
            heading: 'Overcast is a huge soft light',
            body: 'A cloud layer turns the whole sky into one enormous diffuse source. Shadows go soft and shallow because light arrives from nearly everywhere at once.',
          },
          {
            heading: 'Which reveals colour, not form',
            body: 'Hard sun gives you shape, contrast and drama, and it hides local colour in glare and black shadow. Flat light does the reverse: form goes quiet and true colour comes forward.',
          },
          {
            heading: 'Why photographers chase it',
            body: 'Even light is the condition in which a wet leaf, a brick and a coat all show what colour they actually are. Nothing is bleached and nothing is lost in shadow.',
          },
          {
            heading: 'Grey is rarely grey',
            body: 'An overcast sky is usually several greys at once, and almost never neutral. Once you start separating them, a flat day becomes a difficult subject rather than an empty one.',
          },
          {
            heading: 'A different day, not a worse one',
            body: 'Good light is not one thing. A grey day withholds spectacle and hands you accuracy instead, which is the harder and often more useful gift.',
          },
        ],
      },
      drift: {
        title: 'Even light',
        minutes: 7,
        lines: [
          'Picture a day with no sun and no rain. Just even grey.',
          'Look at one ordinary surface in it. A wall, a pavement, a sleeve.',
          'There is no highlight and no shadow to tell you about it.',
          'So look at the colour instead. Just the colour.',
          'Notice how specific it is, now that nothing is dramatising it.',
          'Stay there a while. Nothing is going to happen.',
        ],
      },
      wander: {
        title: 'Separate the greys',
        minutes: 9,
        steps: [
          'Go out and look up. Find two different greys in the sky.',
          'Decide which is warmer. Commit to an answer.',
          'Find a grey on the ground that is not either of them.',
          'Find something you would have walked past in sunshine.',
          'Stand with it until it stops being boring.',
        ],
      },
    },
  },
];

export const dayById = Object.fromEntries(days.map((d) => [d.id, d]));

// The daily question is chosen by date, not by anything inferred about the
// person. Everyone on a given day gets the same question.
export function dayForDate(isoDay) {
  const parts = String(isoDay).split('-').map(Number);
  const epoch = Date.UTC(parts[0], (parts[1] || 1) - 1, parts[2] || 1) / 86400000;
  return days[((Math.floor(epoch) % days.length) + days.length) % days.length];
}
