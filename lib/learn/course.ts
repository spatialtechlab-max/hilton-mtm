/**
 * The Hilton Way: static course content for the Employee Learning Platform.
 *
 * Authored in-house and shipped as code (the atelier does not edit lessons).
 * Prose is original, synthesised from the Hilton Bespoke training manuals;
 * facts are drawn from those manuals, the wording is ours. No em-dashes
 * anywhere, per house style.
 *
 * Progress is keyed off module.slug + lesson.slug, so renaming a slug after
 * employees have started would orphan their progress rows. Add modules and
 * lessons freely; treat existing slugs as stable.
 */

export type Slide = { heading: string; body: string; image?: string };
export type Lesson = { slug: string; title: string; slides: Slide[] };
/** answer = index into options of the correct choice. */
export type QuizQuestion = { q: string; options: string[]; answer: number; feedback: string };
/** passPct = the percentage needed to pass (we use 80 throughout). */
export type Quiz = { passPct: number; questions: QuizQuestion[] };
export type Module = {
  slug: string;
  order: number;
  title: string;
  summary: string;
  lessons: Lesson[];
  quiz: Quiz;
};
export type Course = { slug: string; title: string; intro: string; modules: Module[] };

const PASS_PCT = 80;

export const course: Course = {
  slug: "the-hilton-way",
  title: "The Hilton Way",
  intro:
    "Welcome to Hilton Bespoke. This course turns you from someone who takes measurements into an advisor who turns tailoring into confidence. Work through the seven modules in order. Each ends with a short quiz, and you need 80 percent to pass. Keep the client, not the sale, at the centre of everything.",
  modules: [
    /* ───────────────────────── 1. The Hilton Standard ───────────────────────── */
    {
      slug: "the-hilton-standard",
      order: 1,
      title: "The Hilton Standard",
      summary:
        "The advisor mindset and the consultation method that define Hilton service. Start with purpose, lead with two strong options, speak in plain outcomes, and protect the house.",
      lessons: [
        {
          slug: "the-advisor-mindset",
          title: "The Advisor, Not the Order-Taker",
          slides: [
            {
              heading: "You sell confidence, not cloth",
              body:
                "Your job is to turn tailoring into confidence for the client. Every recommendation should feel knowledgeable, calm, and tied to the person's real life. Measurements and design notes are the mechanics. What the client remembers is feeling understood and well dressed.",
            },
            {
              heading: "Start with purpose",
              body:
                "Before any fabric or feature, ask where the garment will live: the office, a wedding, an evening event, travel, daily wear. Purpose decides everything that follows. One good question about the occasion is worth more than three about taste.",
            },
            {
              heading: "Lead with two strong options",
              body:
                "Most clients decide better when you offer a confident recommendation and one clear alternative, not a wall of choices. Narrow the field for them. A guided decision reads as expertise. An open menu feels like work.",
            },
          ],
        },
        {
          slug: "the-consultation-method",
          title: "The Consultation Method",
          slides: [
            {
              heading: "Speak in outcomes, not jargon",
              body:
                "Translate every technical term into what it changes for the wearer: cleaner, dressier, lighter, sharper, more comfortable, more versatile. The client does not need the history of the peak lapel. He needs to know it reads as more formal and adds presence.",
            },
            {
              heading: "Balance taste with practicality",
              body:
                "A beautiful choice is the wrong choice if the client will not wear it with ease. Match the recommendation to how often he will wear the piece and how he moves through his day. The best option is the one he reaches for again and again.",
            },
            {
              heading: "Follow the sequence",
              body:
                "Work in a settled order: occasion, then fit, then jacket structure, then pockets and vents, then trousers, then shirt and accessories, then finishing details. Moving from the big decisions to the small ones keeps the client oriented and the consultation calm.",
            },
            {
              heading: "Protect the house",
              body:
                "Hilton service should feel reassuring and unhurried. Guide with expertise and never pressure. Close every design conversation by summarising the look in plain language, so the client leaves certain of the direction.",
            },
          ],
        },
      ],
      quiz: {
        passPct: PASS_PCT,
        questions: [
          {
            q: "A client walks in unsure of what he wants. What should you establish first?",
            options: [
              "His budget for the commission",
              "Where and how often he will wear the garment",
              "His preferred lapel shape",
              "The fabric mill he likes",
            ],
            answer: 1,
            feedback: "Purpose comes first. The occasion and frequency of wear guide every later choice.",
          },
          {
            q: "How many options should you usually put in front of a client at a decision point?",
            options: [
              "As many as possible, so he feels in control",
              "A confident recommendation plus one alternative",
              "Exactly one, decided for him",
              "At least five, to show the full range",
            ],
            answer: 1,
            feedback: "Lead with two strong options. A guided choice reads as expertise; a long menu feels like work.",
          },
          {
            q: "A client asks why a peak lapel matters. The best reply explains that it...",
            options: [
              "has a long history in British tailoring",
              "is the most expensive lapel to cut",
              "reads as more formal and adds presence",
              "is required on every business suit",
            ],
            answer: 2,
            feedback: "Speak in outcomes. Translate the detail into what it changes for the wearer.",
          },
          {
            q: "What is the correct consultation sequence?",
            options: [
              "Fabric, then price, then fit, then occasion",
              "Occasion, then fit, then jacket structure, then details",
              "Details first, then fit, then occasion",
              "Accessories, then trousers, then jacket, then fit",
            ],
            answer: 1,
            feedback: "Move from the big decisions to the small ones: occasion, fit, structure, then finishing details.",
          },
          {
            q: "A client loves a bold cloth he will rarely have the chance to wear. The Hilton approach is to...",
            options: [
              "sell it anyway, since the choice is his",
              "balance taste with practicality and steer toward what he will actually wear",
              "refuse the order outright",
              "insist on the safest possible option every time",
            ],
            answer: 1,
            feedback: "A beautiful option is the wrong option if it sits unworn. Match the recommendation to real life.",
          },
        ],
      },
    },

    /* ────────────────── 2. Understanding the Craft (RTW / MTM / Bespoke) ────────────────── */
    {
      slug: "understanding-the-craft",
      order: 2,
      title: "Understanding the Craft: Ready-to-Wear, Made-to-Measure & Bespoke",
      summary:
        "Hilton sits across three ways to buy clothing: ready-to-wear, made-to-measure, and bespoke. Knowing exactly what each gives the client, and what it cannot, lets you place every customer in the right tier with honesty.",
      lessons: [
        {
          slug: "ready-to-wear",
          title: "Ready-to-Wear",
          slides: [
            {
              heading: "What ready-to-wear is",
              body:
                "Ready-to-wear is made to a standard pattern in fixed sizes and sold off the rack. The client takes it home the same day, and it is the most affordable route into tailoring. Nothing about it is built around one body.",
            },
            {
              heading: "Its limits",
              body:
                "The fit is pre-set, so it suits the client only as far as a standard size happens to match him, and there is no personalisation of cloth or detail. Buy ready-to-wear for the design and the price, accepting the fit as it comes.",
            },
          ],
        },
        {
          slug: "made-to-measure",
          title: "Made-to-Measure",
          slides: [
            {
              heading: "What made-to-measure is",
              body:
                "Made-to-measure starts from an existing factory pattern that is then altered to the client's measurements, with a choice of cloth and details on top. It is the step that lets a client change the fit and make the garment his own.",
            },
            {
              heading: "Its limits",
              body:
                "The measurements are flat, two-dimensional figures taken by a salesman, not a pattern shaped by a cutter, so the fit improves on ready-to-wear but has a ceiling. Choose made-to-measure to adjust the fit and personalise the cloth and details.",
            },
          ],
        },
        {
          slug: "bespoke",
          title: "Bespoke",
          slides: [
            {
              heading: "What bespoke is",
              body:
                "Bespoke is built from a personal pattern drafted for one client and refined over two to three fittings. It gives the best fit, the longest life, and full creative control over every element of the garment.",
            },
            {
              heading: "Its trade-offs",
              body:
                "That quality takes time and costs more, since the work is done by hand to one body across several appointments. Reach for bespoke when the client wants the finest fit and the highest quality and is happy to wait for it.",
            },
          ],
        },
        {
          slug: "placing-the-client",
          title: "Placing the Client",
          slides: [
            {
              heading: "The one-line guide",
              body:
                "Hold a simple map in your head: ready-to-wear for design and price, made-to-measure to change the fit and personalise, bespoke for the best fit and quality. Say it plainly and the client understands the ladder in a sentence.",
            },
            {
              heading: "Honesty sells",
              body:
                "Never oversell a tier the client does not need, and never undersell the value of bespoke to someone who wants the best. Matching the person to the right level builds the trust that brings them back.",
            },
          ],
        },
      ],
      quiz: {
        passPct: PASS_PCT,
        questions: [
          {
            q: "What is the main limitation of ready-to-wear?",
            options: [
              "It is the most expensive option",
              "The fit is pre-set and there is no personalisation",
              "It takes weeks to arrive",
              "It cannot be worn to the office",
            ],
            answer: 1,
            feedback: "Ready-to-wear is made to a standard pattern. You take the fit as it comes.",
          },
          {
            q: "Why does made-to-measure fit better than ready-to-wear but not as well as bespoke?",
            options: [
              "It uses cheaper cloth",
              "It alters an existing pattern using flat measurements, not a pattern drafted for the body",
              "It skips fittings entirely",
              "It is only sold in summer",
            ],
            answer: 1,
            feedback: "MTM alters a factory pattern to flat measurements taken by a salesman, so the fit has a ceiling.",
          },
          {
            q: "A client wants the best possible fit and quality and is happy to wait. Which tier?",
            options: ["Ready-to-wear", "Made-to-measure", "Bespoke", "Whichever is cheapest"],
            answer: 2,
            feedback: "Bespoke is built from a personal pattern over several fittings: best fit, longest life, full control.",
          },
        ],
      },
    },

    /* ────────────────── 3. The Client Experience & Selling ────────────────── */
    {
      slug: "the-client-experience",
      order: 3,
      title: "The Client Experience & Selling",
      summary:
        "Selling a tailored garment is less about the sale and more about building a relationship that lasts. A steady nine-step method takes the client from welcome to delivery while making him feel understood at every stage.",
      lessons: [
        {
          slug: "welcome-and-discover",
          title: "Welcome and Discover",
          slides: [
            {
              heading: "Greet and build rapport",
              body:
                "Open by introducing yourself and making the client feel welcome before any selling begins. Ask, in an unhurried way, what has brought him in. A warm, genuine start sets the tone for everything that follows.",
            },
            {
              heading: "Understand the need",
              body:
                "Ask about the occasion, his style preferences, and any specific features he has in mind, such as a particular cloth or cut. Listen more than you speak. The brief he gives you is the foundation of every recommendation.",
            },
            {
              heading: "Measure with care",
              body:
                "Take his measurements properly, and let the act itself show your commitment to a garment made for him. Accuracy here protects the fit. Visible care here builds confidence.",
            },
          ],
        },
        {
          slug: "guide-the-choices",
          title: "Guide the Choices",
          slides: [
            {
              heading: "Present the cloth",
              body:
                "Show a focused selection of fabrics and explain how each affects drape, durability, and breathability. Relate every option back to where and how he will wear the piece. Cloth is where the garment starts to feel personal.",
            },
            {
              heading: "Discuss the style",
              body:
                "Walk him through the key decisions: single or double-breasted, peak or notch lapel, the button stance. Keep each choice tied to formality, proportion, and ease of wear rather than fashion for its own sake.",
            },
            {
              heading: "Recommend, then offer the upgrade",
              body:
                "Make a clear recommendation that fits his needs and budget, and leave a confident path to upgrade if he wants more. Guidance plus a gentle option respects both his wallet and his ambition.",
            },
          ],
        },
        {
          slug: "close-and-care",
          title: "Close and Care",
          slides: [
            {
              heading: "Explain the fitting process",
              body:
                "Tell him plainly how the garment will be adjusted to reach the best fit, and how many appointments to expect. Clarity about the process removes anxiety and sets honest expectations.",
            },
            {
              heading: "Be clear on price and payment",
              body:
                "Set out the pricing and any additional charges openly, with no surprises. At Hilton the client pays half in advance, and you give a trial date at the point of sale. Honesty about money protects the relationship.",
            },
            {
              heading: "Serve through to delivery",
              body:
                "Answer questions, give status updates, and follow up on trial and delivery dates so nothing slips. The sale ends at delivery. The relationship is only beginning, and service after the order is what earns the next one.",
            },
          ],
        },
        {
          slug: "the-words-that-reassure",
          title: "The Words That Reassure",
          slides: [
            {
              heading: "Phrases that build trust",
              body:
                "Reach for plain, confident language. 'For your first bespoke suit, let us keep the foundation timeless and personalise a few details carefully.' Or: 'This gives you the cleanest, most versatile result for business and formal wear.' Calm, specific phrasing makes a nervous client feel safe.",
            },
            {
              heading: "Reasons, not pressure",
              body:
                "Anchor advice to the person. 'My recommendation is based on your build, the occasion, and how often you will wear it.' Never call an option better in every case. Explain why it suits this client, this occasion, this garment, and translate every detail into a clear benefit.",
            },
          ],
        },
      ],
      quiz: {
        passPct: PASS_PCT,
        questions: [
          {
            q: "What is the first step when a client arrives?",
            options: [
              "Quote a price",
              "Greet him and establish rapport",
              "Take his measurements",
              "Show the most expensive cloth",
            ],
            answer: 1,
            feedback: "Begin with a warm welcome and rapport. Selling comes after the client feels at ease.",
          },
          {
            q: "When presenting fabric, what should you tie each option back to?",
            options: [
              "The mill's reputation",
              "How and where the client will wear the garment",
              "The current season's trend",
              "The most profitable cloth",
            ],
            answer: 1,
            feedback: "Relate every cloth to drape, durability, breathability, and the client's real use.",
          },
          {
            q: "How should you describe a style option to a client?",
            options: [
              "As better in every case",
              "With as much tailoring history as possible",
              "By why it suits this client, occasion, and garment",
              "By how fashionable it is right now",
            ],
            answer: 2,
            feedback: "Never call an option universally better. Explain the benefit for this person and this purpose.",
          },
        ],
      },
    },

    /* ────────────────── 4. The Cloth ────────────────── */
    {
      slug: "the-cloth",
      order: 4,
      title: "The Cloth",
      summary:
        "Cloth carries most of what a client feels and a passer-by notices: warmth, weight, drape, and formality. Knowing the main wools, weaves, patterns, and colours lets you steer a client to a fabric that fits the season and the occasion.",
      lessons: [
        {
          slug: "the-wools",
          title: "The Wools",
          slides: [
            {
              heading: "Fine and soft",
              body:
                "Merino is a fine, soft, breathable wool that wears light and comfortable, making it a year-round workhorse. Cashmere, from the cashmere goat, is softer still and barely there in weight, with rich insulation, which is why it sits at the luxury end.",
            },
            {
              heading: "Smooth and structured",
              body:
                "Worsted is a tightly woven wool with a smooth surface. Because it is hardwearing and resists sagging, it is the backbone of business suits. Flannel is a soft, brushed wool with a gentle fuzz and warmth, ideal for cooler-weather trousers and suits.",
            },
            {
              heading: "Textured and warm",
              body:
                "Tweed is a heavy, durable wool woven in muted, mixed shades, often plain, twill, or herringbone, and built for jackets and coats. Mohair, from the Angora goat, adds a crisp, lustrous, slightly hairy texture and is usually blended with sheep's wool.",
            },
          ],
        },
        {
          slug: "blends-and-care",
          title: "Blends and Care",
          slides: [
            {
              heading: "Why blend",
              body:
                "Blends combine the strengths of each fibre. Wool with silk adds sheen and softness for dressier suits, while wool with linen and silk gives drape, strength, and breathability that make it excellent for summer. A good blend can also reach textures no single fibre manages alone.",
            },
            {
              heading: "Caring for the cloth",
              body:
                "Most fine tailoring wools are best dry cleaned and pressed gently, ironing on the wrong side with a cloth to protect the surface. Wool and cashmere can be hand washed with care but should not be ironed hard. Knowing this lets you advise a client on keeping a garment for years.",
            },
          ],
        },
        {
          slug: "patterns",
          title: "Patterns",
          slides: [
            {
              heading: "Plain and pinstripe",
              body:
                "A solid cloth is the most versatile starting point and works for nearly any occasion. Pinstripe sets thin vertical lines into the fabric for a formal, traditional look, most at home in navy or charcoal.",
            },
            {
              heading: "Checks",
              body:
                "Glen check, also called Prince of Wales check, layers small and large checks for a classic, sophisticated effect, often in grey or brown. Windowpane lays a wider grid across the cloth and reads as more relaxed and distinctive.",
            },
            {
              heading: "Weave textures",
              body:
                "Herringbone makes a soft V-shaped, zig-zag texture and moves easily between formal and casual. Houndstooth sets small jagged checks that add personality and texture, classic in wool and tweed.",
            },
          ],
        },
        {
          slug: "colour-and-season",
          title: "Colour and Season",
          slides: [
            {
              heading: "The three foundations",
              body:
                "Navy, charcoal, and mid-grey are the only true business foundations, and a client's first suits should come from here. They are endlessly wearable and quietly authoritative.",
            },
            {
              heading: "What to avoid, what reads casual",
              body:
                "Steer clients away from near-black for business, which can look severe and funeral-like. The paler or brighter a cloth, the more casual it reads, so lift the tone only as the occasion relaxes.",
            },
            {
              heading: "Dressing for the season",
              body:
                "In summer, lean to lighter colours and weights, soft blues, and a little room for pattern, all of which feel cooler. In winter, darker colours, greys, and textured cloths like tweed add warmth and depth.",
            },
          ],
        },
      ],
      quiz: {
        passPct: PASS_PCT,
        questions: [
          {
            q: "Which wool is the smooth, tightly woven backbone of a business suit?",
            options: ["Tweed", "Worsted", "Mohair", "Flannel"],
            answer: 1,
            feedback: "Worsted is smooth, hardwearing, and resists sagging, which makes it the staple suiting wool.",
          },
          {
            q: "Which three colours are the true foundations of a business wardrobe?",
            options: [
              "Black, brown, and beige",
              "Navy, charcoal, and mid-grey",
              "Sky blue, tan, and white",
              "Burgundy, green, and grey",
            ],
            answer: 1,
            feedback: "Navy, charcoal, and mid-grey are the versatile, authoritative foundations. Near-black is best avoided.",
          },
          {
            q: "A client needs a suit for hot weather. What do you steer toward?",
            options: [
              "Heavy near-black worsted",
              "Lighter colours and weights, and breathable blends",
              "Thick winter tweed",
              "The darkest cloth available",
            ],
            answer: 1,
            feedback: "Summer calls for lighter colours and weights and breathable cloths like wool-linen-silk blends.",
          },
        ],
      },
    },

    /* ────────────────── 5. Style Options A to Z ────────────────── */
    {
      slug: "style-options",
      order: 5,
      title: "Style Options A to Z",
      summary:
        "The Hilton customizer offers twenty-five decisions across the jacket, trousers, and shirt. Each one quietly shifts formality, comfort, or character, and your job is to guide the client to a balanced, wearable whole.",
      lessons: [
        {
          slug: "jacket-fit-buttons-lapel",
          title: "The Jacket: Fit, Buttons, Lapel",
          slides: [
            {
              heading: "Find your fit",
              body:
                "Explain fit in three directions: slim for a sharp modern line, tailored for a balanced shape that follows the body without squeezing, and classic for ease and timeless comfort. Tailored suits most clients. Good tailoring shapes the body, it never grips it.",
            },
            {
              heading: "Button your style",
              body:
                "Two buttons are the safest, most versatile stance and the right default. One button reads slightly dressier and cleaner for evening, and three feel more traditional and can suit a taller frame. Tie the choice to formality and proportion, not fashion.",
            },
            {
              heading: "Spell your lapel",
              body:
                "The notch lapel is the versatile standard and the natural first choice. The peak is bolder and more formal and broadens the chest, while the shawl is smooth and rounded and belongs on tuxedos and dinner jackets.",
            },
          ],
        },
        {
          slug: "jacket-vents-pockets-structure",
          title: "The Jacket: Vents, Pockets, Structure",
          slides: [
            {
              heading: "To vent or not",
              body:
                "Double vents are the most balanced choice, giving easy movement and a clean drape when hands go in pockets. A single vent is simpler and common on ready-to-wear, while no vent is the cleanest but most restrictive. Recommend double vents for most clients.",
            },
            {
              heading: "Pick pocket",
              body:
                "Flap pockets are the versatile business standard, jetted pockets are cleaner and dressier for formal and evening wear, and patch pockets feel relaxed and sit well on blazers and summer jackets. Match the pocket to the cloth and the occasion.",
            },
            {
              heading: "Ticket pocket and lining",
              body:
                "A ticket pocket is a small extra pocket above the right hip, a quiet heritage flourish offered as an enhancement rather than a default. Lining is the other structure decision: full lining gives structure and durability, while half or unlined construction breathes and feels softer for warm weather.",
            },
            {
              heading: "Single or double-breasted",
              body:
                "A single-breasted jacket is the everyday default. A double-breasted jacket creates a stronger, more architectural chest and a more formal presence, flattering when cut well and especially on taller frames. Offer it as a confident choice the client must be comfortable wearing.",
            },
          ],
        },
        {
          slug: "the-trousers",
          title: "The Trousers",
          slides: [
            {
              heading: "Pleat your case",
              body:
                "Flat fronts look clean and modern and flatter slimmer builds. A single pleat balances elegance with comfort through the thigh and when seated, and a double pleat is fuller and more traditional. Modern pleats, cut correctly, are tailored rather than baggy.",
            },
            {
              heading: "Hem and waistband",
              body:
                "A plain hem is sharp and formal and the only correct finish on a tuxedo, while turn-ups (cuffs) add weight and a classic character that suits flannel and heavier cloth. At the waist, belt loops are familiar, side adjusters look more refined, and a plain waistband is cleanest with braces.",
            },
            {
              heading: "Back pockets and braces",
              body:
                "Two buttoned back pockets give a balanced, practical finish, and one or none reads cleaner. Braces hold the trousers from the shoulders for a clean, unbroken line and need a waistband built for them, usually without belt loops.",
            },
          ],
        },
        {
          slug: "the-shirt",
          title: "The Shirt",
          slides: [
            {
              heading: "Placket and pocket",
              body:
                "A French (clean) front is refined and dressy and suits tailored business shirts, a standard placket is traditional and a touch sportier, and a hidden placket is for formal evening wear. A pocketless front is dressier under a jacket. Add a pocket only when the client needs it.",
            },
            {
              heading: "Collar",
              body:
                "The collar frames the face and sets the formality. Point collars are classic, spread and semi-spread collars are the modern business standard and carry a tie knot well, button-down collars are casual, and wing collars are for black tie only. Read the client's face shape and tie habits.",
            },
            {
              heading: "Cuffs",
              body:
                "Barrel cuffs are the everyday standard for business and daily wear. French cuffs fold back and fasten with cufflinks for formal occasions, and convertible cuffs offer both. Ask whether the client actually wears cufflinks before recommending French cuffs.",
            },
            {
              heading: "Back pleats and tuxedo shirt",
              body:
                "A smooth or darted back is sharpest, while side or box pleats add movement for broader shoulders. A tuxedo shirt should support the dinner jacket, not compete with it: a clean or pleated front, French cuffs, and a dress collar keep the jacket the hero.",
            },
          ],
        },
        {
          slug: "bespoke-flourishes",
          title: "Bespoke Flourishes",
          slides: [
            {
              heading: "Sleeve buttons and stitching",
              body:
                "Most sleeves carry three or four buttons. Four feels slightly dressier, and working (surgeon's) cuffs are a true mark of tailoring that should be set with care, since later sleeve alterations get harder. Hand-pick (AMF) stitching along the lapel and pocket edges adds quiet, handmade texture, best kept subtle.",
            },
            {
              heading: "The waistcoat",
              body:
                "A waistcoat turns a two-piece into a three-piece and adds structure and presence, useful when the client will remove the jacket at an event. A lined back is lighter for wear under a jacket, while a self-back in the suit cloth looks richer when the waistcoat is worn alone.",
            },
          ],
        },
      ],
      quiz: {
        passPct: PASS_PCT,
        questions: [
          {
            q: "Which jacket fit suits most clients?",
            options: ["Slim", "Tailored", "Classic", "Whichever is tightest"],
            answer: 1,
            feedback: "Tailored follows the body without squeezing: refined yet comfortable for most clients.",
          },
          {
            q: "Which vent style do you recommend for most clients?",
            options: [
              "No vent, for the cleanest look",
              "Single vent",
              "Double vents, for movement and drape",
              "It never matters",
            ],
            answer: 2,
            feedback: "Double vents move well and drape cleanly, especially when hands go in the pockets.",
          },
          {
            q: "When is a plain hem the only correct trouser finish?",
            options: ["On flannel trousers", "On a tuxedo", "On tweed suits", "On casual chinos"],
            answer: 1,
            feedback: "Never put turn-ups on a tuxedo. A plain hem is the formal, correct finish there.",
          },
        ],
      },
    },

    /* ────────────────── 6. Reading the Body & Fit ────────────────── */
    {
      slug: "reading-the-body",
      order: 6,
      title: "Reading the Body & Fit",
      summary:
        "A great recommendation starts with reading the person in front of you. Fit type and a few proportion principles let you flatter any build and turn a good cloth into a garment that suits the man.",
      lessons: [
        {
          slug: "the-three-fits",
          title: "The Three Fits",
          slides: [
            {
              heading: "Slim, tailored, classic",
              body:
                "Slim follows the body's lines closely for a sharp, modern look and suits lean frames. Tailored is tapered but comfortable and is the right default for most clients. Classic leaves generous room for movement and reads timeless and easy.",
            },
            {
              heading: "Comfort is non-negotiable",
              body:
                "Whatever the fit, the garment should flatter without restricting. Guide clients away from over-tightness: tailoring should shape the body, not squeeze it. A man who is comfortable from the first minute wears the suit with confidence.",
            },
          ],
        },
        {
          slug: "adding-height",
          title: "Adding Height",
          slides: [
            {
              heading: "The lengthening toolkit",
              body:
                "To make a client look taller, keep a close fit and a long, unbroken lapel line, raise the trouser to a higher rise, and minimise interruptions across the body. A lower button stance deepens the V and visually stretches the torso.",
            },
            {
              heading: "Fine, dark, and quiet",
              body:
                "Choose dark, fine worsted in a solid or subtle pattern, and avoid turn-ups, which cut the leg. The eye travels smoothly up an uninterrupted line, so the fewer the breaks, the taller the silhouette.",
            },
          ],
        },
        {
          slug: "tall-thin-and-larger-builds",
          title: "Tall, Thin, and Larger Builds",
          slides: [
            {
              heading: "Tall or thin: interrupt the line",
              body:
                "For a tall or thin client, do the opposite of lengthening. Add texture, checks, and patterns, use patch or ticket pockets, turn-ups, and a belt to break the vertical line. Treat a thin build like a tall one. These interruptions add visual weight and balance.",
            },
            {
              heading: "Larger builds: treat like short",
              body:
                "For a larger client, follow the height-adding principles: a clean, close (not tight) fit, dark fine cloth, a long lapel line, and few interruptions. The aim is a smooth, lengthening silhouette that flatters rather than adds bulk.",
            },
          ],
        },
        {
          slug: "face-shape-and-the-collar",
          title: "Face Shape and the Collar",
          slides: [
            {
              heading: "Match the collar to the face",
              body:
                "The collar frames the face, so balance it against the client's shape. Suggest a spread collar for a narrow face to add width, and a point collar for a rounder face for a slimming effect.",
            },
            {
              heading: "Habits matter too",
              body:
                "Beyond face shape, read how the client actually dresses: his tie habits and usual wardrobe. A spread collar carries a larger knot well, while button-down collars belong with sport coats, not sharp business suits.",
            },
          ],
        },
      ],
      quiz: {
        passPct: PASS_PCT,
        questions: [
          {
            q: "Which fit is the right default for most clients?",
            options: ["Slim", "Tailored", "Classic", "The tightest available"],
            answer: 1,
            feedback: "Tailored is tapered but comfortable: a sharp line without sacrificing ease.",
          },
          {
            q: "To make a client look taller, you should...",
            options: [
              "add checks, turn-ups, and patch pockets",
              "keep a close fit, a long lapel line, higher-rise trousers, and few interruptions",
              "choose a pale, bright cloth",
              "use a high button stance and a short lapel",
            ],
            answer: 1,
            feedback: "An unbroken vertical line lengthens. Fine dark worsted and minimal interruptions add height.",
          },
          {
            q: "Which collar flatters a narrow face?",
            options: ["A point collar", "A spread collar", "A button-down collar", "A wing collar"],
            answer: 1,
            feedback: "A spread collar adds width to a narrow face. A point collar slims a rounder one.",
          },
        ],
      },
    },

    /* ────────────────── 7. The Fitting & Measurement Process ────────────────── */
    {
      slug: "the-fitting-process",
      order: 7,
      title: "The Fitting & Measurement Process",
      summary:
        "A garment is only as good as the numbers it is built from and the order that carries it to the client. Learn the jacket, trouser, and shirt measurement sets, then the workflow from estimate to delivery: deposit, trial date, cutting with a margin, accurate entry, trials, finishing, and follow-up.",
      lessons: [
        {
          slug: "measuring-the-jacket",
          title: "Measuring the Jacket",
          slides: [
            {
              heading: "The jacket measurement set",
              body:
                "A jacket is read across six core points: length, chest, stomach, hip and seat, shoulder, and sleeves. Length sets how the coat falls, chest and stomach shape the body of the garment, hip and seat govern the skirt of the jacket, and shoulder and sleeve settle the frame. Take each point in the same order every time so nothing is missed.",
            },
            {
              heading: "The arm: biceps and wrist",
              body:
                "Two further points finish the sleeve: the biceps and the wrist. Biceps decides how cleanly the sleeve sits over the arm without pulling, and wrist sets the opening so the cuff breaks correctly over the hand. A sleeve that is right at both ends moves with the client rather than against him.",
            },
            {
              heading: "Measure with a steady hand",
              body:
                "Keep the tape snug but never tight, and let the client stand naturally rather than holding a pose. Record every figure as you go, in the same unit throughout. The measurements are the whole foundation of the fit, so a minute of care here saves a retrial later.",
            },
          ],
        },
        {
          slug: "trousers-and-shirt",
          title: "Measuring Trousers and Shirt",
          slides: [
            {
              heading: "The trouser set",
              body:
                "Trousers are read across six points: waist, hip, knee, bottom, length, and thigh. Waist and hip set the seat, thigh and knee shape the leg, bottom fixes the opening at the shoe, and length decides the break. Balance these against the client's build so the trouser sits cleanly without gripping or bagging.",
            },
            {
              heading: "The shirt set",
              body:
                "A shirt is read across four points: collar (the neck), chest, sleeve, and length. Collar is the one felt most day to day, so leave a finger of room for comfort. Chest governs the drape, sleeve sets the cuff at the wrist, and length keeps the shirt tucked through movement.",
            },
          ],
        },
        {
          slug: "estimate-to-cut",
          title: "From Estimate to Cut",
          slides: [
            {
              heading: "Start with an estimate",
              body:
                "Most clients begin by asking what a commission will cost, so prepare a clear estimate first. A good estimate sets honest expectations and opens the order. Once he is comfortable with it, move on to customising the garment and taking the measurements.",
            },
            {
              heading: "Deposit and trial date",
              body:
                "Hilton takes fifty percent in advance at the point of sale, and you give the client a trial date there and then. Record the trial for the tailors a day ahead of the client's appointment, so the garment is ready when he arrives. Clear money terms and a firm date protect the relationship.",
            },
            {
              heading: "Cutting the fabric",
              body:
                "The tailor master reads the measurements and calls the exact length of cloth and lining to cut from the roll. Always cut about five centimetres extra. That margin gives room for alterations at trial and protects against a cut that leaves no cloth to adjust.",
            },
          ],
        },
        {
          slug: "trials-and-delivery",
          title: "Trials, Finishing, and Delivery",
          slides: [
            {
              heading: "Enter the measurements accurately",
              body:
                "After the fabric is cut, enter the measurements into the system with every element covered and nothing rounded away. The invoice number ties the figures to the payment, and the printout goes to the tailor master to assign the work. A precise entry here is what a good fit is built on.",
            },
            {
              heading: "Trials and retrials",
              body:
                "Set the trial with the workload in mind, and follow up with the client on the date and time. If the tailor master calls for a retrial, treat those dates with the same care. Trials are where a good measurement becomes a garment that truly fits, so never let one drift.",
            },
            {
              heading: "Finish, deliver, follow up",
              body:
                "When the trial is right, record it and prepare the piece for delivery. Deliver on time, every time, because the promised date is part of the service. Then follow up after the client has the garment. The order closes at delivery, and the relationship carries into the next commission.",
            },
          ],
        },
      ],
      quiz: {
        passPct: PASS_PCT,
        questions: [
          {
            q: "How much does Hilton take in advance at the point of sale?",
            options: [
              "The full amount",
              "Fifty percent",
              "Nothing until delivery",
              "A fixed handling fee",
            ],
            answer: 1,
            feedback: "Hilton takes fifty percent in advance and gives the client a trial date at the same moment.",
          },
          {
            q: "When cutting cloth from the roll, how much extra should you allow?",
            options: [
              "No extra, cut to the exact length",
              "About five centimetres extra",
              "Double the length",
              "As little as possible to save cloth",
            ],
            answer: 1,
            feedback: "Always cut about five centimetres extra so there is cloth to adjust at trial.",
          },
          {
            q: "Which set of points is used to measure a jacket?",
            options: [
              "Waist, hip, knee, bottom, length, thigh",
              "Collar, chest, sleeve, length",
              "Length, chest, stomach, hip and seat, shoulder, sleeves, plus biceps and wrist",
              "Only chest and length",
            ],
            answer: 2,
            feedback: "A jacket is read across length, chest, stomach, hip and seat, shoulder, and sleeves, finished by the biceps and wrist.",
          },
        ],
      },
    },
  ],
};

/** Every module, ordered. */
export const modules = [...course.modules].sort((a, b) => a.order - b.order);

/** Look up a module by its slug. */
export function moduleBySlug(slug: string): Module | undefined {
  return course.modules.find((m) => m.slug === slug);
}

/** Total lessons across the whole course (for the dashboard progress bar). */
export function totalLessons(): number {
  return course.modules.reduce((n, m) => n + m.lessons.length, 0);
}
