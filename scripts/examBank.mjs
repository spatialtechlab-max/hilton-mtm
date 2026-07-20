/**
 * The Hilton Way: master examination bank.
 *
 * Ten scenario questions per module (90 total across the nine modules). Each
 * question carries one, two, or three correct options. A question with a single
 * correct option is a single-select (radio) in the player; a question with two
 * or three correct options is a multi-select (checkbox). The `correct` array
 * holds 0-based indices into `options`.
 *
 * Anti-copy design (wired in the next phase): the player draws a random 5 of a
 * module's 10 questions per attempt, and shuffles the option order, so two
 * staff rarely see the same paper. This file is the FULL bank with answers, for
 * review only. It is not imported by any app surface yet.
 *
 * House style: no em-dashes anywhere. Facts are drawn from lib/learn/course.ts
 * and the Hilton Bespoke training manuals.
 */

export const examBank = [
  /* ───────────────────────── 1. The Hilton Standard ───────────────────────── */
  {
    order: 1,
    slug: "the-hilton-standard",
    title: "The Hilton Standard",
    questions: [
      {
        id: "m1-q01",
        scenario:
          "A visibly nervous first-time client walks in with no clear idea of what he wants. Before you reach for a single swatch, what should you establish?",
        options: [
          "His budget ceiling, so you can price the room",
          "Where and how often he will wear the garment",
          "His preferred lapel shape",
          "The mill or brand of cloth he likes",
        ],
        correct: [1],
        rationale:
          "Purpose comes first. The occasion and frequency of wear quietly settle every later choice, and a nervous first-timer needs fewer decisions, not a wall of them.",
      },
      {
        id: "m1-q02",
        scenario:
          "You are coaching a new advisor on the habit of leading with two strong options. Which statements about that habit are correct? (Select all that apply.)",
        options: [
          "Present your recommendation first, with the reason behind it",
          "Keep the alternative genuinely distinct, so the choice is real",
          "Lay out as many swatches as possible so he feels in control",
          "Once you have made your pick, spread the full book behind it so he can compare",
        ],
        correct: [0, 1],
        rationale:
          "Recommendation plus one distinct alternative reads as expertise. Spreading the full book behind your pick is the open menu the method avoids, so that option is wrong.",
      },
      {
        id: "m1-q03",
        scenario:
          "A client needs one suit to wear to the office five days a week, but he keeps returning to a delicate Super 150s in a striking colour that he loves in the mirror. What is the Hilton approach?",
        options: [
          "Sell the 150s; the choice is his and the sale is real",
          "Steer him to a durable workhorse for the daily suit and reserve the 150s as a considered second piece",
          "Refuse the commission outright",
          "Insist on the safest navy and drop the 150s from the conversation entirely",
        ],
        correct: [1],
        rationale:
          "A beautiful choice is the wrong choice if it sits unworn or wears out. Match the workhorse to real life; offer the expressive cloth as a second, cared-for garment.",
      },
      {
        id: "m1-q04",
        scenario:
          "'Speak in outcomes, not jargon.' Which of these are genuine outcome translations rather than jargon? (Select all that apply.)",
        options: [
          "Double vents keep the jacket clean when you sit or put your hands in your pockets",
          "A half lining makes a summer jacket feel lighter on the shoulder",
          "The peak lapel has a long history in British tailoring",
          "A peak lapel reads as more formal and adds presence",
        ],
        correct: [0, 1, 3],
        rationale:
          "Name the feature, then attach the benefit the wearer can feel. History is jargon; comfort, lightness, and formality are outcomes.",
      },
      {
        id: "m1-q05",
        scenario:
          "You want the consultation to feel guided rather than scattered. What is the correct sequence to work through?",
        options: [
          "Details first, then fit, then occasion",
          "Occasion, then fit, then jacket structure, then pockets and vents, then trousers, then shirt, then finishing",
          "Fabric, then price, then fit, then occasion",
          "Accessories, then trousers, then jacket, then fit",
        ],
        correct: [1],
        rationale:
          "Move from the big decisions to the small ones. Each large decision sets the boundaries for the smaller ones that follow.",
      },
      {
        id: "m1-q06",
        scenario:
          "A regular is set on a shirt-and-suit combination you can see will not flatter him. What does 'protect the house' ask you to do?",
        options: [
          "Push the highest-value cloth to protect the margin",
          "Say so plainly and offer the better path, because a man talked out of a mistake becomes loyal",
          "Stay silent to avoid friction; the customer is always right",
          "Add more features so the eye is distracted from the problem",
        ],
        correct: [1],
        rationale:
          "A man sold a mistake blames the tailor when he sees the photographs. A man quietly steered right becomes loyal. Your authority is the craft, never pressure.",
      },
      {
        id: "m1-q07",
        scenario:
          "A confident regular who values his time comes in on a busy afternoon. Which behaviours fit the Hilton mindset for him? (Select all that apply.)",
        options: [
          "Move quickly and respect his time",
          "Walk him through every single option at length to prove thoroughness",
          "Read the person before the garment",
          "Withhold any recommendation until he has seen the entire range first",
        ],
        correct: [0, 2],
        rationale:
          "Read the person: a confident regular wants pace and respect for his time. Both walking him through everything and withholding your recommendation waste the time he is guarding.",
      },
      {
        id: "m1-q08",
        scenario:
          "In one sentence, how should an advisor understand the whole of their role?",
        options: [
          "An order-taker who fills in the form accurately and quickly",
          "Part stylist and part architect, guiding the client toward what flatters him",
          "A cloth specialist first and a people person second",
          "A closer who never leaves an appointment without a deposit",
        ],
        correct: [1],
        rationale:
          "The stylist reads his colouring, build, and life; the architect knows what the cloth, canvas, and cut can and cannot do. Bring both to every appointment.",
      },
      {
        id: "m1-q09",
        scenario:
          "You are 'starting with purpose'. Which questions genuinely belong to that step? (Select all that apply.)",
        options: [
          "Where will the garment be worn (office, wedding, evening, travel, daily)",
          "How often does he expect to wear it",
          "Where in the world does he wear it most",
          "Which mill does he prefer",
        ],
        correct: [0, 1, 2],
        rationale:
          "Occasion, frequency, and climate-of-wear are purpose. A suit built for a US winter fails the same man in Bahrain heat. Mill preference is not purpose.",
      },
      {
        id: "m1-q10",
        scenario:
          "A client came in asking for timeless wardrobe value, then gets drawn to a trend-driven detail he will rarely use. What is the balanced Hilton move?",
        options: [
          "Fit the trend detail as the foundation piece; it is what excites him now",
          "Offer the trend detail as a considered second piece and keep the foundation versatile",
          "Refuse the detail; trends have no place at Hilton",
          "Add every trend detail he mentions so he feels indulged",
        ],
        correct: [1],
        rationale:
          "Practicality keeps elegance in service. Reserve the expressive, trend-led choice for a second garment; keep the workhorse timeless and versatile.",
      },
    ],
  },

  /* ────────────── 2. Understanding the Craft (RTW / MTM / Bespoke) ────────────── */
  {
    order: 2,
    slug: "understanding-the-craft",
    title: "Understanding the Craft: Ready-to-Wear, Made-to-Measure & Bespoke",
    questions: [
      {
        id: "m2-q01",
        scenario:
          "A graduate needs a first suit for interviews next week, has a tight budget and a close-to-standard build. Which tier serves him honestly?",
        options: [
          "Bespoke, so he starts with the best",
          "Made-to-measure, for a personalised fit",
          "Ready-to-wear, altered at the sleeve and waist and out the same day",
          "Whichever carries the highest margin",
        ],
        correct: [2],
        rationale:
          "Same-day, close-to-standard build, tight budget: ready-to-wear with a good alteration is the right, honest placement. Overselling bespoke would be a disservice.",
      },
      {
        id: "m2-q02",
        scenario:
          "A ready-to-wear jacket fits your client badly at the shoulder. Why can a tailor not simply fix it?",
        options: [
          "The cloth is too cheap to take a needle",
          "The shoulder and the coat's balance are fixed at the factory, and the shoulder cannot be moved without effectively rebuilding the jacket",
          "Ready-to-wear cannot be altered at all",
          "Altering it would void a warranty",
        ],
        correct: [1],
        rationale:
          "A waist or sleeve can be taken in, but the shoulder and balance are factory-set. The shoulder is the one thing RTW cannot save.",
      },
      {
        id: "m2-q03",
        scenario:
          "Which of these are genuine limits of made-to-measure? (Select all that apply.)",
        options: [
          "It works from flat, two-dimensional measurements taken by a salesman",
          "It cannot fully read posture, a rounded back, a dropped shoulder, or a prominent seat",
          "It offers no choice of cloth or details",
          "The fit improves on ready-to-wear but has a ceiling",
        ],
        correct: [0, 1, 3],
        rationale:
          "MTM alters a factory pattern to flat figures, so the fit has a ceiling on posture. It does personalise cloth and details, so that option is false.",
      },
      {
        id: "m2-q04",
        scenario:
          "A newly promoted manager wants two properly fitting suits in his own navy and grey. He travels constantly and cannot sit through several fittings. Which tier?",
        options: [
          "Ready-to-wear",
          "Made-to-measure",
          "Bespoke",
          "Whichever is cheapest that week",
        ],
        correct: [1],
        rationale:
          "His figures and his cloth on a proven pattern, ready in a fraction of the bespoke wait: made-to-measure is the sweet spot for the travelling client.",
      },
      {
        id: "m2-q05",
        scenario:
          "What does bespoke give a client that the other two tiers cannot? (Select all that apply.)",
        options: [
          "A personal pattern drafted for one client and refined over two to three fittings",
          "The best fit and the longest life",
          "Same-day collection off the rack",
          "A fixed factory pattern shared across many clients",
        ],
        correct: [0, 1],
        rationale:
          "Bespoke is a personal pattern giving the best fit and longest life. A shared factory pattern is exactly what bespoke is not, and same-day collection is ready-to-wear's advantage.",
      },
      {
        id: "m2-q06",
        scenario:
          "A hard-to-fit client with a dropped shoulder and a prominent seat wants the finest possible fit and is happy to wait weeks. Which tier?",
        options: [
          "Ready-to-wear",
          "Made-to-measure",
          "Bespoke",
          "It makes no difference for his build",
        ],
        correct: [2],
        rationale:
          "A build outside the standard block, plus a wish for the finest fit and the patience to wait, is the textbook case for bespoke.",
      },
      {
        id: "m2-q07",
        scenario:
          "'Honesty sells' at the tier decision. Which statements capture it correctly? (Select all that apply.)",
        options: [
          "Never oversell a tier the client does not need",
          "Never undersell the value of bespoke to a client who wants the best",
          "Always steer to the highest tier, since that maximises the sale",
          "Matching the person to the right level builds the trust that brings him back",
        ],
        correct: [0, 1, 3],
        rationale:
          "A well-matched client returns for his next three suits and sends others. Steering everyone upward is the opposite of the Hilton method.",
      },
      {
        id: "m2-q08",
        scenario:
          "What is the one-line map of the three tiers you can offer a first-time visitor?",
        options: [
          "Ready-to-wear for the rich, made-to-measure for the middle, bespoke for the poor",
          "Ready-to-wear for design and price, made-to-measure to change the fit and personalise, bespoke for the best fit and quality",
          "They are the same garment at three price points",
          "Made-to-measure is always the right answer",
        ],
        correct: [1],
        rationale:
          "That single sentence lets a first-time visitor grasp the ladder in one breath, a distinction many shops never bother to explain.",
      },
      {
        id: "m2-q09",
        scenario:
          "A client keeps returning to the fit in the mirror on a ready-to-wear jacket that is close but not right. What is this your cue to do?",
        options: [
          "Reassure him it is fine and close the sale",
          "Treat it as the honest signal to show him the next tier, made-to-measure",
          "Offer a discount to settle his doubt",
          "Tell him every suit fits that way",
        ],
        correct: [1],
        rationale:
          "When he cares more about the exact fit than the same-day collection, walk him up a rung rather than talk him out of his own eye.",
      },
      {
        id: "m2-q10",
        scenario:
          "Which of these are honest trade-offs a client accepts when he chooses bespoke? (Select all that apply.)",
        options: [
          "It takes more time, across several appointments",
          "It costs more, because the work is done by hand to one body",
          "It gives a lower-quality fit than made-to-measure",
          "The timeline is best left vague so the client is not put off",
        ],
        correct: [0, 1],
        rationale:
          "Time and cost are the honest trade-offs. Bespoke gives the best fit, not a lower one, and the timeline should be set honestly at the outset, never left vague.",
      },
    ],
  },

  /* ────────────── 3. The Client Experience & Selling ────────────── */
  {
    order: 3,
    slug: "the-client-experience",
    title: "The Client Experience & Selling",
    questions: [
      {
        id: "m3-q01",
        scenario:
          "A client has just walked through the door. What is the correct first step of the nine-step method?",
        options: [
          "Quote a price so expectations are set",
          "Greet him and build rapport before any selling begins",
          "Take his measurements to save time later",
          "Show him the most expensive cloth to anchor quality",
        ],
        correct: [1],
        rationale:
          "You cannot take a good brief from a man who is not yet at ease, so rapport comes before the tape and the swatches.",
      },
      {
        id: "m3-q02",
        scenario:
          "Why are the nine steps ordered the way they are? Which statements are correct? (Select all that apply.)",
        options: [
          "Rapport comes before the brief, because you cannot take a good brief from a man who is not at ease",
          "The brief comes before the cloth, because you cannot recommend well until you know the occasion",
          "The upgrade is offered before the recommendation",
          "The recommendation comes before the upgrade, so the client hears his budget was respected",
        ],
        correct: [0, 1, 3],
        rationale:
          "Each step earns the right to the next. The recommendation must land before the upgrade, never after or instead of it.",
      },
      {
        id: "m3-q03",
        scenario:
          "Beyond producing accurate numbers, what else does careful, methodical measuring achieve?",
        options: [
          "Nothing beyond the figures themselves",
          "It quietly proves your care and builds the client's confidence before the cloth is cut",
          "It justifies charging a higher price",
          "It removes the need for a trial later",
        ],
        correct: [1],
        rationale:
          "The measuring moment is quietly persuasive. A client who sees you take pains believes in the result before he has seen the cloth cut.",
      },
      {
        id: "m3-q04",
        scenario:
          "You are presenting cloth to a client. Which of these are correct practice? (Select all that apply.)",
        options: [
          "Show a focused selection chosen for his brief, not the whole book",
          "Explain each cloth in outcomes he can feel (stays sharp through the day, breathes in the heat)",
          "Keep the cloth on the table, since handling it distracts from your explanation",
          "Always lead with the most profitable cloth in the room",
        ],
        correct: [0, 1],
        rationale:
          "A curated few explained in outcomes feel like expertise. Hand him the cloth to touch, since drape and weight in his own hand sell better than words, so keeping it on the table is wrong.",
      },
      {
        id: "m3-q05",
        scenario:
          "How is payment handled at the point of sale at Hilton?",
        options: [
          "The full amount is taken up front",
          "Fifty percent is taken in advance, and a trial date is given at the same moment",
          "Nothing is taken until delivery",
          "It is spread evenly across each fitting",
        ],
        correct: [1],
        rationale:
          "Hilton takes fifty percent in advance and hands over the trial date in the same breath, so the money and the promise are tied together.",
      },
      {
        id: "m3-q06",
        scenario:
          "A client asks how you would describe a style option to him. What is the right way?",
        options: [
          "As better in every case, so he feels confident",
          "By why it suits this client, this occasion, and this garment",
          "With as much tailoring history as you can offer",
          "By how fashionable it is this season",
        ],
        correct: [1],
        rationale:
          "Never call an option universally better. Anchor advice to his build, the occasion, and how often he will wear it, and translate every detail into a benefit.",
      },
      {
        id: "m3-q07",
        scenario:
          "'Recommend, then offer the upgrade.' Which of these are correct? (Select all that apply.)",
        options: [
          "Lead with the option that genuinely fits his budget",
          "Present the upgrade as an invitation, not a push",
          "If he declines the upgrade, let it go gracefully",
          "Keep returning to the upgrade until he accepts it",
        ],
        correct: [0, 1, 2],
        rationale:
          "Naming the budget-right option first is what earns the right to mention the step up. The client who never feels pressured is the one who trades up next time.",
      },
      {
        id: "m3-q08",
        scenario:
          "Where does the sale end, and where does the relationship begin?",
        options: [
          "The sale ends at the deposit; the relationship ends at delivery",
          "The sale ends at delivery; the relationship is only beginning, and service after the order earns the next one",
          "Both end at delivery",
          "The relationship ends the moment the suit is collected",
        ],
        correct: [1],
        rationale:
          "Follow-up when nothing is being sold turns a satisfied buyer into a client for life. Delivery is the start of the relationship, not the end.",
      },
      {
        id: "m3-q09",
        scenario:
          "A nervous client needs reassuring. Which of these reflect the Hilton way of reassuring with words? (Select all that apply.)",
        options: [
          "'My recommendation is based on your build, the occasion, and how often you will wear it.'",
          "'This option is simply better than the others in every case.'",
          "'For your first bespoke suit, let us keep the foundation timeless and personalise a few details carefully.'",
          "Closing with a firm push to decide today before the offer changes",
        ],
        correct: [0, 2],
        rationale:
          "Reasons tied to the person and calm, specific phrasing reassure. A blanket 'better in every case' invites doubt, and a closing push is pressure, which the Hilton method never uses.",
      },
      {
        id: "m3-q10",
        scenario:
          "Why does running the nine steps in order matter so much?",
        options: [
          "It is a rigid script the client must hear word for word",
          "Each step earns the right to the next; skip one and you feel it later as an uneasy client",
          "It simply makes the sale faster",
          "It is a legal requirement of trading",
        ],
        correct: [1],
        rationale:
          "The steps are a track, not a script. Skip the brief or the plain money terms and it returns later as a client unsure what he agreed to.",
      },
    ],
  },

  /* ────────────── 4. The Cloth ────────────── */
  {
    order: 4,
    slug: "the-cloth",
    title: "The Cloth",
    questions: [
      {
        id: "m4-q01",
        scenario:
          "A client wants one suit that will take daily office wear and still look sharp after a year. Which wool is the smooth, tightly woven backbone for it?",
        options: ["Tweed", "Worsted", "Flannel", "Mohair"],
        correct: [1],
        rationale:
          "Worsted is smooth, hardwearing, and resists sagging and shine, which is why it is the backbone of the business suit.",
      },
      {
        id: "m4-q02",
        scenario:
          "A first-time client asks where to start building a wardrobe. Which three colours are the true business foundations?",
        options: [
          "Black, brown, and beige",
          "Navy, charcoal, and mid-grey",
          "Sky blue, tan, and white",
          "Burgundy, green, and grey",
        ],
        correct: [1],
        rationale:
          "Navy first, then charcoal, then mid-grey: endlessly wearable and quietly authoritative. Near-black is best reserved for black tie and funerals.",
      },
      {
        id: "m4-q03",
        scenario:
          "A client needs a suit for real summer heat. Which of these should you steer toward? (Select all that apply.)",
        options: [
          "Lighter colours and weights",
          "A breathable wool-linen-silk blend",
          "A heavy near-black worsted",
          "A more open weave",
        ],
        correct: [0, 1, 3],
        rationale:
          "Summer wants lighter colour and weight, an open weave, and a breathable blend. Heavy near-black worsted is the opposite of what the heat needs.",
      },
      {
        id: "m4-q04",
        scenario:
          "A client asks how to keep a fine wool suit for years. Which care advice is correct? (Select all that apply.)",
        options: [
          "Most fine wools are best dry cleaned and pressed gently",
          "Iron on the wrong side through a pressing cloth to protect the surface",
          "A hot iron straight on the face is fine and gives a good shine",
          "Rest a suit a day or two between wears and hang it on a shaped hanger",
        ],
        correct: [0, 1, 3],
        rationale:
          "Protect the surface: dry clean, press on the wrong side through a cloth, rest and hang the suit. A hot iron on the face glazes and shines the cloth.",
      },
      {
        id: "m4-q05",
        scenario:
          "A client wants a soft, subtly lustrous suit for an evening event. Which blend do you reach for?",
        options: [
          "Wool and linen",
          "Wool and silk",
          "Pure tweed",
          "Pure heavy worsted",
        ],
        correct: [1],
        rationale:
          "Wool with silk adds sheen and softness for dressier suits. Linen breathes but relaxes and creases; tweed and heavy worsted read country and business, not evening.",
      },
      {
        id: "m4-q06",
        scenario:
          "Match the patterns to how they read. Which statements are correct? (Select all that apply.)",
        options: [
          "Glen check (Prince of Wales) reads sophisticated without shouting",
          "Windowpane is bolder, and its wider grid adds visual width",
          "Bird's eye is a bold statement best kept to separates",
          "Pinstripe reads casual and is best avoided for business",
        ],
        correct: [0, 1],
        rationale:
          "Glen check reads sophisticated and windowpane adds width. Bird's eye is actually subtle (houndstooth is the bold one), and pinstripe lengthens and suits formal business, so the bird's eye and pinstripe options are both false.",
      },
      {
        id: "m4-q07",
        scenario:
          "A client is buying a suit to wear to a funeral. What is correct guidance?",
        options: [
          "Only pure black is acceptable",
          "Dark colours as a sign of respect; black traditionally, but charcoal and navy equally correct",
          "A light grey summer suit is fine",
          "A subtle pattern to lift the mood",
        ],
        correct: [1],
        rationale:
          "A funeral asks for dark colours as a sign of respect. Black is traditional, but charcoal and navy are equally correct.",
      },
      {
        id: "m4-q08",
        scenario:
          "A client says he needs a 'tuxedo'. Which description confirms he means the right garment?",
        options: [
          "A three-piece with a matching waistcoat for daytime ceremony",
          "A dinner jacket with a satin or grosgrain lapel and a satin stripe down the trouser, worn for black tie",
          "A tailcoat with striped trousers and a waistcoat for weddings",
          "A conservative, understated business suit",
        ],
        correct: [1],
        rationale:
          "The tuxedo or dinner jacket carries a satin or grosgrain lapel and a satin trouser stripe for black tie. The tailcoat description is the morning suit.",
      },
      {
        id: "m4-q09",
        scenario:
          "You are choosing shirt cottons for a client. Which pairings are correct? (Select all that apply.)",
        options: [
          "Poplin is the crisp, lightweight default for a dress shirt",
          "Oxford is thicker, more casual, and at home under a sports jacket",
          "Chambray is a heavy, formal cloth reserved for evening dress shirts",
          "Linen never wrinkles, which is why it suits summer",
        ],
        correct: [0, 1],
        rationale:
          "Poplin and Oxford are placed correctly. Chambray is actually a lightweight, casual cloth that looks like denim, and linen does wrinkle, so the chambray and linen options are both false.",
      },
      {
        id: "m4-q10",
        scenario:
          "A client already owns two business suits and has a wedding coming up. You are building a wardrobe, not selling a garment. Which moves are correct? (Select all that apply.)",
        options: [
          "Ask what he already owns before you recommend",
          "Steer him toward a peak-lapel or three-piece statement rather than a third navy",
          "Sell him a third navy business suit for consistency",
          "If he travels, point him to a hard-wearing high-twist cloth that resists the suitcase",
        ],
        correct: [0, 1, 3],
        rationale:
          "Read the gaps so each commission completes the set. A third navy duplicates what he owns; the wedding calls for a statement piece.",
      },
    ],
  },

  /* ────────────── 5. Fabric Mastery & Climate ────────────── */
  {
    order: 5,
    slug: "fabric-mastery-climate",
    title: "Fabric Mastery & Climate",
    questions: [
      {
        id: "m5-q01",
        scenario:
          "A client compares two cloths and asks what the higher 'Super' number really tells him. What is the accurate answer?",
        options: [
          "The cloth is heavier and warmer",
          "The yarn is finer and silkier with better drape, but the cloth is less durable and more wrinkle-prone",
          "It is always the best choice for a daily suit",
          "It is cheaper to produce",
        ],
        correct: [1],
        rationale:
          "The Super number is a dial with two ends. Higher means finer, silkier, better draping, but also more delicate and more prone to wrinkling.",
      },
      {
        id: "m5-q02",
        scenario:
          "A client wants a suit that feels special but still earns regular executive wear and the odd evening event. Which Super band is the sweet spot?",
        options: [
          "Super 110s to 120s",
          "Super 130s to 140s",
          "Super 150s to 160s",
          "Super 180s and above",
        ],
        correct: [1],
        rationale:
          "Super 130s to 140s is the sweet spot: it feels noticeably finer and drapes beautifully, yet holds up for executive daily wear and events.",
      },
      {
        id: "m5-q03",
        scenario:
          "A man wants one suit for the office five days a week that also lives in a suitcase. Which Super band is the honest recommendation?",
        options: [
          "Super 110s to 120s",
          "Super 150s to 160s",
          "The highest number in the book",
          "Super 130s to 140s",
        ],
        correct: [0],
        rationale:
          "Super 110s to 120s is the durable band: it resists wrinkling, holds shape, and takes daily wear and travel without complaint.",
      },
      {
        id: "m5-q04",
        scenario:
          "A client asks for a Super 150s black suit for daily office wear 'because it feels the softest.' What is wrong, and what do you do? (Select all that apply.)",
        options: [
          "Black is too severe for daytime business; charcoal or navy is sharper and more flattering",
          "Super 150s is too delicate for daily desk work and wears fast at the elbows and seat",
          "The request is entirely correct; sell it as asked",
          "Pivot to a Super 120s navy for daily wear and reserve the 150s for a special occasion or tuxedo",
        ],
        correct: [0, 1, 3],
        rationale:
          "Both premises are off: black is too severe for daytime, 150s too delicate for daily wear. Pivot to durable navy and seed the special-occasion 150s for later.",
      },
      {
        id: "m5-q05",
        scenario:
          "A client needs a business suit for a hot, humid climate. Which cloth is the ultimate summer business fabric?",
        options: [
          "Flannel",
          "Heavy worsted tweed",
          "Fresco and high-twist wool",
          "Brushed cashmere",
        ],
        correct: [2],
        rationale:
          "Fresco and high-twist wools have an open weave that moves air and a tight twist that resists wrinkling, so the client stays cool and still looks pressed.",
      },
      {
        id: "m5-q06",
        scenario:
          "Which cloths suit a hot and humid climate such as Bahrain? (Select all that apply.)",
        options: [
          "Fresco and high-twist wool",
          "Linen and cotton, with the wrinkle caveat set honestly",
          "Heavy worsted, the warmest and most structured cloth in the book",
          "Heavy flannel",
        ],
        correct: [0, 1],
        rationale:
          "Fresco and linen and cotton suit the heat. Heavy worsted and heavy flannel both trap heat and belong to cool and temperate climates, so the heavy worsted and heavy flannel options are wrong.",
      },
      {
        id: "m5-q07",
        scenario:
          "Which cloths suit a cool and temperate climate such as a US or European winter? (Select all that apply.)",
        options: [
          "Flannel",
          "Tweed",
          "Heavy worsteds",
          "Open-weave Fresco",
        ],
        correct: [0, 1, 2],
        rationale:
          "Flannel traps heat, tweed and heavy worsteds carry warmth and structure. Open-weave Fresco is a hot-weather cloth.",
      },
      {
        id: "m5-q08",
        scenario:
          "What is the single principle that links every hot-weather and cold-weather cloth choice?",
        options: [
          "Colour is all that really matters",
          "In heat you want cloth that moves air and stands off the body; in cold, cloth that traps air and sits close and warm",
          "Heavier cloth is always the better choice",
          "Lighter cloth is always the better choice",
        ],
        correct: [1],
        rationale:
          "Match the client's destination to the right side of that line and he is comfortable in every season, which is the quiet luxury a bespoke house sells.",
      },
      {
        id: "m5-q09",
        scenario:
          "Before naming any cloth for climate, which single question decides everything?",
        options: [
          "What is his budget",
          "Where does he intend to wear the garment the most",
          "What colour does he prefer",
          "Which mill does he trust",
        ],
        correct: [1],
        rationale:
          "A suit crafted for a US winter fails the same man in Bahrain heat. Once you know where the garment lives, the cloth almost chooses itself.",
      },
      {
        id: "m5-q10",
        scenario:
          "You need to correct a client's fabric request without losing him. Which beats belong to the correct three-beat method? (Select all that apply.)",
        options: [
          "Acknowledge the instinct behind the request, the softness or elegance he is really after",
          "Explain the trade-off in plain outcomes",
          "Tell him plainly that he is wrong",
          "Offer the better path with a reason tied to him",
        ],
        correct: [0, 1, 3],
        rationale:
          "Acknowledge, explain the trade-off, offer the better path. Never tell him he is wrong; the correction should land as expertise, not resistance.",
      },
    ],
  },

  /* ────────────── 6. Silhouette, Structure & Fit ────────────── */
  {
    order: 6,
    slug: "silhouette-structure-fit",
    title: "Silhouette, Structure & Fit",
    questions: [
      {
        id: "m6-q01",
        scenario:
          "A client asks why one jacket costs more than another that looks similar on the hanger. What is the hallmark of full-canvas over half-canvas?",
        options: [
          "The canvas is glued rather than stitched",
          "The canvas runs the whole length of the jacket, moulds to the body over time, breathes, and lasts longest",
          "There is no canvas at all",
          "The canvas sits only in the sleeves",
        ],
        correct: [1],
        rationale:
          "Full-canvas floats shoulder to hem, so the jacket moulds to the wearer, breathes, and outlives fused ones. Half-canvas stops around the chest.",
      },
      {
        id: "m6-q02",
        scenario:
          "Which statements about half-canvas construction are correct? (Select all that apply.)",
        options: [
          "The canvas runs from the shoulder through the chest and then stops",
          "It is an excellent entry point for made-to-measure",
          "It gives structure where it shows, with the skirt draping soft below",
          "It moulds to the whole body over time better than full-canvas",
        ],
        correct: [0, 1, 2],
        rationale:
          "Half-canvas structures the chest and shoulders and lets the skirt hang soft, at an accessible price. Full-canvas is the one that moulds along the whole front.",
      },
      {
        id: "m6-q03",
        scenario:
          "A client says he wants a suit that 'looks powerful and commands a room' but does not know the terminology. Which silhouette is he describing?",
        options: [
          "The Italian (Neapolitan) cut",
          "The American sack suit",
          "The British (Savile Row) cut: padded shoulders, suppressed waist, lower button stance, double vents",
          "Any soft, unstructured cut",
        ],
        correct: [2],
        rationale:
          "The British cut projects authority: padded shoulder, sculpted chest, nipped waist. That is what a man usually means by powerful and sharp.",
      },
      {
        id: "m6-q04",
        scenario:
          "A client wants a soft shoulder that follows his own line, with little or no padding and a higher button stance. Which cut and signature is he after?",
        options: [
          "The British cut with structured padding",
          "The Italian (Neapolitan) cut, with its spalla camicia shirt-style shoulder",
          "The American sack suit with a single vent",
          "None of these; it cannot be done",
        ],
        correct: [1],
        rationale:
          "The spalla camicia sets the sleeve softly into the jacket with no padding, so the shoulder follows the body. It is the Neapolitan signature.",
      },
      {
        id: "m6-q05",
        scenario:
          "Which features describe the American sack suit? (Select all that apply.)",
        options: [
          "A natural, unpadded shoulder",
          "A straight fit with little or no waist suppression",
          "Double vents and a lower button stance",
          "A heavily padded shoulder and a nipped waist",
        ],
        correct: [0, 1],
        rationale:
          "The sack suit is natural, straight, and single-vented. Double vents with a lower stance and a padded shoulder with a nipped waist both describe the British cut, so the double-vent option and the padded-shoulder-with-nipped-waist option are wrong.",
      },
      {
        id: "m6-q06",
        scenario:
          "You are checking a jacket's fit. Where should the shoulder seam end on a well-fitting coat?",
        options: [
          "A few centimetres past the shoulder, for room",
          "Exactly where the collarbone meets the shoulder",
          "Inside the shoulder, toward the neck",
          "It does not matter; alterations will fix it",
        ],
        correct: [1],
        rationale:
          "The seam sits on the bone. Past it and the shoulder divots; too short and the lapels bow outward. This is the one point alterations cannot save.",
      },
      {
        id: "m6-q07",
        scenario:
          "You are judging a client's current suit. Which of these are genuine fault signals? (Select all that apply.)",
        options: [
          "The shoulder seam extends past the bone and the fabric divots",
          "A collar gap opens between the jacket collar and the neck when he moves",
          "A deep, X-shaped set of creases radiates from the fastened button",
          "A slight tension across the fastened button",
        ],
        correct: [0, 1, 2],
        rationale:
          "Divot, collar gap, and a deep X all read as poor fit. A slight tension at the button is fine and even desirable for a modern, fitted line.",
      },
      {
        id: "m6-q08",
        scenario:
          "A stouter client with larger thighs is choosing a trouser front. What do you recommend, and why?",
        options: [
          "A flat front, because it is the modern default",
          "A single or double pleat, because it gives room through the hip and thigh and stops the pockets flaring",
          "The tightest possible cut, to look sharp",
          "It makes no difference to the fit",
        ],
        correct: [1],
        rationale:
          "A pleat is an accordion that expands when he sits and gives room through the thigh. A flat front on that build pulls tight and flares the side pockets.",
      },
      {
        id: "m6-q09",
        scenario:
          "A client wants a standard business suit and asks which trouser break is safest. What do you tell him?",
        options: [
          "No break",
          "Half (medium) break",
          "Full break",
          "Never break the trouser",
        ],
        correct: [1],
        rationale:
          "The half break is a single slight fold, the safest and most classic choice, correct for a standard business suit and flattering on almost every client.",
      },
      {
        id: "m6-q10",
        scenario:
          "A stout, broad-shouldered client asks for a double-breasted suit in a heavy windowpane with skinny, flat-front, no-break trousers. How do you pivot him toward proportion? (Select all that apply.)",
        options: [
          "Single-breasted with peak lapels, to draw the eye up and off the midsection",
          "A solid or subtle vertical pinstripe instead of the heavy windowpane",
          "A single pleat and a half break instead of the skinny no-break trouser",
          "Keep the skinny trousers, since they modernise the look",
        ],
        correct: [0, 1, 2],
        rationale:
          "Skinny trousers under a broad body create the top-heavy 'lightbulb' shape. Single-breasted peak lapels, a solid or pinstripe, and a pleated half-break balance him.",
      },
    ],
  },

  /* ────────────── 7. Style Options A to Z ────────────── */
  {
    order: 7,
    slug: "style-options",
    title: "Style Options A to Z",
    questions: [
      {
        id: "m7-q01",
        scenario:
          "A client is unsure which fit to choose. Which fit is the balanced default that flatters most clients?",
        options: ["Slim", "Tailored", "Classic", "Whichever is tightest"],
        correct: [1],
        rationale:
          "Tailored follows the body without squeezing. Good tailoring shapes the body, it never grips it.",
      },
      {
        id: "m7-q02",
        scenario:
          "A shorter client wants to look taller. Which button stance helps, and why?",
        options: [
          "A high three-button stance, to add formality",
          "A lower button stance (a one-button or low two-button), which deepens the V and visually elongates the torso",
          "It makes no difference to his height",
          "A double-breasted six-button front",
        ],
        correct: [1],
        rationale:
          "A lower button stance deepens the V of the opening and stretches the torso, which helps a shorter client read taller.",
      },
      {
        id: "m7-q03",
        scenario:
          "A client is drawn to a peak lapel. Which statements about it are correct? (Select all that apply.)",
        options: [
          "It is bolder and more formal than a notch",
          "It sweeps upward to broaden the chest and narrow the waist",
          "It is the most casual lapel, best for summer blazers",
          "It belongs only on tuxedos and dinner jackets",
        ],
        correct: [0, 1],
        rationale:
          "The peak is the bold, formal upgrade that broadens the chest. It is not a casual lapel, and the shawl, not the peak, is the one reserved for tuxedos, so the casual-lapel option and the tuxedo-only option are wrong.",
      },
      {
        id: "m7-q04",
        scenario:
          "A client sits often, drives, and moves through a busy day. Which vent style do you recommend?",
        options: [
          "No vent, for the cleanest front",
          "A single vent",
          "Double vents, for movement and a clean drape when hands go in the pockets",
          "It never matters",
        ],
        correct: [2],
        rationale:
          "Double vents let the jacket fall back cleanly instead of bunching when he sits or reaches into a pocket, which is best for an active day.",
      },
      {
        id: "m7-q05",
        scenario:
          "Match pocket style to use. Which pairings are correct? (Select all that apply.)",
        options: [
          "Flap pockets are the versatile business standard",
          "Jetted pockets are cleaner and dressier for formal and evening wear",
          "Jetted pockets are the most casual and belong on a summer blazer",
          "Patch pockets are the dressiest choice, best for a tuxedo",
        ],
        correct: [0, 1],
        rationale:
          "Flap for business, jetted for evening. Patch pockets are the casual, relaxed choice (not the dressiest), and jetted are the dressy evening line (not the most casual), so the patch-is-dressiest option and the jetted-is-most-casual option are both wrong.",
      },
      {
        id: "m7-q06",
        scenario:
          "When is a plain hem the only correct trouser finish?",
        options: [
          "On flannel trousers",
          "On a tuxedo",
          "On tweed suits",
          "On casual chinos",
        ],
        correct: [1],
        rationale:
          "A plain hem is the sharp, formal finish and the only correct one on a tuxedo. Turn-ups suit flannel and heavier cloth, never black tie.",
      },
      {
        id: "m7-q07",
        scenario:
          "A client with a narrow, long face habitually ties a large knot. Which collars suit him? (Select all that apply.)",
        options: [
          "A spread or semi-spread collar",
          "A cutaway collar",
          "A button-down collar",
          "A wing collar for daily wear",
        ],
        correct: [0, 1],
        rationale:
          "The spread and the cutaway both open outward to carry a large knot and add width to a narrow, long face. Button-down is casual; the wing is black-tie only.",
      },
      {
        id: "m7-q08",
        scenario:
          "A client asks where the Hilton brand mark goes on his shirt. What is the house standard?",
        options: [
          "A discreet logo on the cuff",
          "No external brand label or logo on the chest or cuff; all branding stays on the inside garment tag",
          "A small monogram on the chest",
          "The brand woven into the outer collar",
        ],
        correct: [1],
        rationale:
          "Hilton shirts are pure, unbranded elegance. The mark stays hidden on the inside tag; the cloth, collar, and fit do the talking.",
      },
      {
        id: "m7-q09",
        scenario:
          "A client reaches for his old orphaned suit jacket to dress down. Which features make a true sports jacket the better garment? (Select all that apply.)",
        options: [
          "Softer construction with less padding",
          "Textured fabrics such as tweed, herringbone, linen, and hopsack",
          "Contrasting buttons in horn, mother of pearl, or metal",
          "Smooth worsted with matching buttons",
        ],
        correct: [0, 1, 2],
        rationale:
          "A true sports jacket is soft, textured, and built with contrasting buttons for contrasting trousers. Smooth worsted with matching buttons is the suit jacket.",
      },
      {
        id: "m7-q10",
        scenario:
          "A client is interested in working (surgeon's) cuffs and pick stitching. Which statements are correct? (Select all that apply.)",
        options: [
          "Working cuffs should be set with care, because later sleeve alterations get harder once the buttonholes are cut",
          "Some men leave the last working cuff button undone to quietly show the garment is genuinely bespoke",
          "Heavy contrast pick stitching is the most elegant, timeless choice",
          "A fine, quiet pick along the lapel and pockets adds handmade character and keeps the edges flat",
        ],
        correct: [0, 1, 3],
        rationale:
          "Set working cuffs only once the fit is settled. Fine, subtle pick stitching reads as craft; heavy contrast thread looks busy and dates quickly.",
      },
    ],
  },

  /* ────────────── 8. Reading the Body & Fit ────────────── */
  {
    order: 8,
    slug: "reading-the-body",
    title: "Reading the Body & Fit",
    questions: [
      {
        id: "m8-q01",
        scenario:
          "Which fit is the right default for most clients, tapered but comfortable?",
        options: ["Slim", "Tailored", "Classic", "The tightest available"],
        correct: [1],
        rationale:
          "Tailored traces the body without gripping. Slim suits lean frames; classic suits the man who prizes ease; tailored is the safe default.",
      },
      {
        id: "m8-q02",
        scenario:
          "You want to make a client look taller. Which choices belong to the lengthening toolkit? (Select all that apply.)",
        options: [
          "Keep a close fit and a long, unbroken lapel line",
          "Raise the trouser to a higher rise",
          "Add turn-ups (cuffs) to the trouser",
          "Choose dark, fine worsted in a solid or subtle pattern",
        ],
        correct: [0, 1, 3],
        rationale:
          "The eye travels up an unbroken vertical line. Close fit, higher rise, and dark fine cloth all lengthen; turn-ups cut the leg and shorten it.",
      },
      {
        id: "m8-q03",
        scenario:
          "A tall, thin client needs balancing. Which choices flatter his build? (Select all that apply.)",
        options: [
          "Texture, checks, and patterns like Glen plaid and windowpane",
          "Turn-ups, a belt, and patch or ticket pockets to break the vertical line",
          "A slim, dark, monochrome outfit with no interruptions",
          "A dark, fine, unbroken vertical line",
        ],
        correct: [0, 1],
        rationale:
          "Treat a thin build like a tall one: add texture, weight, and horizontal breaks. A dark, unbroken, monochrome line does the opposite job (it adds height and slims), so the slim-monochrome option and the unbroken-vertical-line option are wrong.",
      },
      {
        id: "m8-q04",
        scenario:
          "A larger client comes in. Which build should you treat him like, and how?",
        options: [
          "Like a tall, thin client: add interruptions and texture",
          "Like a short client: a clean close-not-tight fit, dark fine cloth, a long lapel line, and few interruptions",
          "It makes no difference; treat every build the same",
          "Add a heavy windowpane to give him presence",
        ],
        correct: [1],
        rationale:
          "The same lengthening logic that adds height also slims. Dark fine cloth, clean drape, and minimal breaks flatter a larger build; a windowpane only adds width.",
      },
      {
        id: "m8-q05",
        scenario:
          "Which collar flatters a narrow face by adding width?",
        options: [
          "A point collar",
          "A spread collar",
          "A button-down collar",
          "A wing collar",
        ],
        correct: [1],
        rationale:
          "A spread collar opens outward and lends width to a narrow face. A point collar does the opposite job.",
      },
      {
        id: "m8-q06",
        scenario:
          "Which collar slims a rounder, fuller face by drawing the eye downward?",
        options: [
          "A spread collar",
          "A cutaway collar",
          "A point collar",
          "A wing collar",
        ],
        correct: [2],
        rationale:
          "A point collar draws the eye downward and lengthens a rounder or fuller face. The spread and cutaway add width, which a broad face does not need.",
      },
      {
        id: "m8-q07",
        scenario:
          "A high-contrast client (fair skin, dark hair) is choosing an outfit. Which pairings suit him? (Select all that apply.)",
        options: [
          "A dark navy suit with a crisp white shirt",
          "A medium grey suit with a light blue shirt",
          "High-contrast pairings that match his natural contrast",
          "An olive suit with an ecru shirt",
        ],
        correct: [0, 2],
        rationale:
          "Match the outfit's contrast to the face. High-contrast clients suit dark-and-white pairings. Grey-with-blue and olive-with-ecru are low-contrast combinations.",
      },
      {
        id: "m8-q08",
        scenario:
          "You are using undertone to fine-tune colour. Which statements are correct? (Select all that apply.)",
        options: [
          "Warm complexions (olive or yellow undertone) shine in earth tones, browns, and warm greens",
          "Cool complexions (pink or blue undertone) look best in true blues, greys, and crisp black",
          "Undertone helps choose between two shades that are both, on paper, correct",
          "Undertone is irrelevant once you know the client's contrast",
        ],
        correct: [0, 1, 2],
        rationale:
          "Contrast sets the pairing; undertone sets the exact shade. Warm skin wants a golden brown, cool skin a greyer taupe, so undertone still matters.",
      },
      {
        id: "m8-q09",
        scenario:
          "A low-contrast client (fair skin, blonde hair) is choosing a suit and shirt. What is the flattering pairing?",
        options: [
          "A stark black suit with a bright white shirt",
          "A monochromatic or low-contrast pairing, such as medium grey with light blue",
          "The highest-contrast combination you can build",
          "Any bold clash of colours to add interest",
        ],
        correct: [1],
        rationale:
          "A stark dark-and-white combination overpowers a low-contrast man. Keep the outfit in harmony with his colouring rather than shouting over it.",
      },
      {
        id: "m8-q10",
        scenario:
          "For a stout or broad client, how should colour and pattern work? (Select all that apply.)",
        options: [
          "Avoid heavy patterns like a thick windowpane that add width",
          "Use dark solids or a subtle vertical pinstripe to lengthen and slim",
          "Choose a bold windowpane check to add presence",
          "Add turn-ups and a contrast belt for extra interest",
        ],
        correct: [0, 1],
        rationale:
          "Dark solids and fine verticals slim and lengthen. A bold windowpane adds width, and turn-ups and a contrast belt add horizontal breaks, so the bold-windowpane option and the turn-ups-and-belt option both work against slimming.",
      },
    ],
  },

  /* ────────────── 9. The Fitting & Measurement Process ────────────── */
  {
    order: 9,
    slug: "the-fitting-process",
    title: "The Fitting & Measurement Process",
    questions: [
      {
        id: "m9-q01",
        scenario:
          "At the point of sale, how much does Hilton take in advance?",
        options: [
          "The full amount",
          "Fifty percent",
          "Nothing until delivery",
          "A fixed handling fee",
        ],
        correct: [1],
        rationale:
          "Hilton takes fifty percent in advance and hands the client a trial date in the same moment, tying the money to the promise.",
      },
      {
        id: "m9-q02",
        scenario:
          "The tailor master is about to cut cloth from the roll. How much extra should be allowed?",
        options: [
          "No extra; cut to the exact length",
          "About five centimetres extra",
          "Double the required length",
          "As little as possible, to save cloth",
        ],
        correct: [1],
        rationale:
          "Always cut about five centimetres extra. Cloth can be trimmed at trial but never added back once the roll is cut short.",
      },
      {
        id: "m9-q03",
        scenario:
          "Which points make up the jacket measurement set? (Select all that apply.)",
        options: [
          "Length, chest, stomach, hip and seat, shoulder, and sleeves",
          "Biceps and wrist",
          "Knee and bottom",
          "Collar (neck)",
        ],
        correct: [0, 1],
        rationale:
          "A jacket is read across length, chest, stomach, hip and seat, shoulder, and sleeves, finished by the biceps and wrist. Knee and bottom are trouser; collar is shirt.",
      },
      {
        id: "m9-q04",
        scenario:
          "Which points make up the trouser measurement set? (Select all that apply.)",
        options: [
          "Waist and hip",
          "Knee and thigh",
          "Bottom and length",
          "Collar and biceps",
        ],
        correct: [0, 1, 2],
        rationale:
          "Trousers are read across waist, hip, knee, bottom, length, and thigh. Collar and biceps belong to the shirt and jacket sets.",
      },
      {
        id: "m9-q05",
        scenario:
          "A shirt is read across which four points?",
        options: [
          "Waist, hip, knee, length",
          "Collar (the neck), chest, sleeve, and length",
          "Chest, stomach, shoulder, sleeve",
          "Only collar and sleeve",
        ],
        correct: [1],
        rationale:
          "The shirt set is collar, chest, sleeve, and length. Leave a finger of room at the collar for comfort and the slight shrink of laundering.",
      },
      {
        id: "m9-q06",
        scenario:
          "You are handling the deposit and the trial date. Which of these are correct? (Select all that apply.)",
        options: [
          "Give the client a trial date at the point of sale",
          "Record the tailors' trial a day ahead of the client's own appointment, so the garment is ready",
          "Give the trial date only after the first fitting is complete",
          "Book the client's trial before the tailors' one, so he sets the pace",
        ],
        correct: [0, 1],
        rationale:
          "Give the trial date at the point of sale and book the tailors' trial a day ahead so the garment is ready. Delaying the date until after the first fitting, or letting the client's trial precede the tailors', are both wrong.",
      },
      {
        id: "m9-q07",
        scenario:
          "A colleague asks why the five-centimetre cutting margin matters. What is the real reason?",
        options: [
          "So the shop can charge for more cloth",
          "Cloth can be trimmed at trial but never added back once cut short, so the margin gives room to adjust",
          "It is a tradition with no practical purpose",
          "So there are offcuts for a matching pocket square",
        ],
        correct: [1],
        rationale:
          "The margin is cheap insurance against an expensive mistake. Every adjustment still open to you at trial depends on that small extra being there.",
      },
      {
        id: "m9-q08",
        scenario:
          "Hilton runs several bill books. Which uses are correct? (Select all that apply.)",
        options: [
          "Main Bill Book for suits, shirts, trousers, waistcoats, and stitching-only invoices",
          "Alteration Bill Book only for alteration charges",
          "The Alteration Bill Book for new suit and shirt orders",
          "The internal Textile book (no VAT number) for a customer's suit purchase",
        ],
        correct: [0, 1],
        rationale:
          "The Main book covers garments and stitching; the Alteration book is only for alterations, never new orders. The internal Textile book has no VAT number and must never carry a customer transaction, so the new-order-in-the-Alteration-book option and the Textile-book option are wrong.",
      },
      {
        id: "m9-q09",
        scenario:
          "Cloth and garments move between the Zinj, Manama, and Diplomat branches. Which practices are correct? (Select all that apply.)",
        options: [
          "Every inward and outward transfer must be recorded accurately in the books and files",
          "When you send cloth to another branch, log it out; when you receive one, log it in",
          "Coordinate trials across branches so a client can be seen at the nearest one",
          "Transfers between branches need not be logged, since it is all one house",
        ],
        correct: [0, 1, 2],
        rationale:
          "An unrecorded transfer is stock that has vanished on paper. Honest, up-to-date transfer records are what make one seamless service possible across branches.",
      },
      {
        id: "m9-q10",
        scenario:
          "After the fabric is cut, you enter the measurements into the Hilton Tailor Made database. How should this be done?",
        options: [
          "Rounded to the nearest number, to save time",
          "Complete, in the same units you measured, checked against your notes, with the invoice number tying the figures to the payment",
          "Skipped; the tailor will remember the numbers",
          "For the jacket only; the rest can follow later",
        ],
        correct: [1],
        rationale:
          "The entry is the single record the tailor works from. Anything rounded off or left blank is a fit detail quietly lost between the client and the garment.",
      },
    ],
  },
];

/** Convenience totals for the renderer. */
export function bankTotals() {
  const questions = examBank.reduce((n, m) => n + m.questions.length, 0);
  let single = 0;
  let multi = 0;
  for (const m of examBank) {
    for (const q of m.questions) {
      if (q.correct.length === 1) single += 1;
      else multi += 1;
    }
  }
  return { modules: examBank.length, questions, single, multi };
}
