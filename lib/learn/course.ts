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
                "Your job is to turn tailoring into confidence for the client. Every recommendation should feel knowledgeable, calm, and tied to the person's real life. Measurements and design notes are the mechanics. What the client remembers is feeling understood and well dressed.\n\nA man does not walk into a room thinking about his cloth weight, he thinks about how he is seen, so the feeling you leave him with outlasts any single detail you choose together. Read the person before the garment: a nervous first-timer needs steady reassurance and fewer decisions, while a confident regular wants you to move quickly and respect his time. Set the tone with a simple promise, that your job is to make sure he looks clean and feels comfortable from the first minute he puts the suit on.",
            },
            {
              heading: "Start with purpose",
              body:
                "Before any fabric or feature, ask where the garment will live: the office, a wedding, an evening event, travel, daily wear. Purpose decides everything that follows. One good question about the occasion is worth more than three about taste.\n\nPurpose is the lever that quietly settles the harder decisions later: a suit built for daily office wear leans toward navy or grey worsted and a notch lapel, while the same client dressing for his own wedding can be steered toward a peak lapel and a richer cloth. Ask how often he expects to wear it as well as where, because frequency separates a versatile foundation piece from a statement worn twice a year. When you know the occasion you can lead with confidence instead of guessing, and the whole consultation moves in one clear direction.",
            },
            {
              heading: "Lead with two strong options",
              body:
                "Most clients decide better when you offer a confident recommendation and one clear alternative, not a wall of choices. Narrow the field for them. A guided decision reads as expertise. An open menu feels like work.\n\nToo many niche terms and swatches at once leave a client anxious rather than served, so do the narrowing for him and present your pick first with the reason behind it. Frame it as, this is what I would suggest for your build and the occasion, with this second option if you want something a little different. Keep the alternative genuinely distinct so the choice is real, then let him feel he decided rather than that he was sold to.",
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
                "Translate every technical term into what it changes for the wearer: cleaner, dressier, lighter, sharper, more comfortable, more versatile. The client does not need the history of the peak lapel. He needs to know it reads as more formal and adds presence.\n\nThe habit to build is to name a feature and immediately attach the benefit, so double vents become the choice that keeps the jacket clean when you sit or slip your hands in your pockets, and a half lining becomes the reason the summer jacket feels lighter on the shoulder. Avoid a run of tailoring terms in a row, which impresses no one and quietly loses the client. If you catch yourself explaining how a detail is made, turn it around and explain what it does for him instead, because comfort, movement, and formality are the only currencies he is really buying.",
            },
            {
              heading: "Balance taste with practicality",
              body:
                "A beautiful choice is the wrong choice if the client will not wear it with ease. Match the recommendation to how often he will wear the piece and how he moves through his day. The best option is the one he reaches for again and again.\n\nA cloth he loves in the mirror but will only wear twice a year is rarely the right first commission, whereas a versatile navy earns its place in the wardrobe every week. Ask practical questions about his day, whether he sits for long stretches, drives often, or moves actively, because those answers point to pleats, vents, and cloth weight that keep him comfortable. Never push a trend-driven detail on a man who came in asking for timeless wardrobe value, and when he is set on something impractical, offer it as a considered second piece rather than the foundation.",
            },
            {
              heading: "Follow the sequence",
              body:
                "Work in a settled order: occasion, then fit, then jacket structure, then pockets and vents, then trousers, then shirt and accessories, then finishing details. Moving from the big decisions to the small ones keeps the client oriented and the consultation calm.\n\nThe order is not arbitrary: each large decision sets the boundaries for the smaller ones, so settling the occasion and the fit first means the pocket, vent, and stitching choices almost recommend themselves. Jumping ahead to a finishing detail before the foundation is set forces you to unpick it later when the purpose turns out to point elsewhere. Hold the client to the sequence gently, and the consultation feels guided and unhurried rather than scattered.",
            },
            {
              heading: "Protect the house",
              body:
                "Hilton service should feel reassuring and unhurried. Guide with expertise and never pressure. Close every design conversation by summarising the look in plain language, so the client leaves certain of the direction.\n\nThe close is where confidence is either sealed or lost, so read the whole look back to him in plain English, the fit, the cloth, the lapel, and the details you settled together, and let him hear that it all hangs together. A client who can picture the finished garment clearly leaves certain, and certainty is what protects both the relationship and the house's name. Pressure has no place here: your authority comes from knowing the craft, not from urging the sale, and a calm, expert summary does more for the next commission than any push ever could.",
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
                "Ready-to-wear is made to a standard pattern in fixed sizes and sold off the rack. The client takes it home the same day, and it is the most affordable route into tailoring. Nothing about it is built around one body.\n\nThe trade to weigh is immediacy and price against fit, so ready-to-wear suits the client who needs something in hand today, has a close-to-standard build, or is buying a first suit on a careful budget. Be honest that he is buying the design and the convenience, and that a good alteration to the length and waist can carry it a long way. When he cares more about the exact fit than the same-day collection, that is your cue to walk him up to made-to-measure rather than talk him out of the rack.",
            },
            {
              heading: "Its limits",
              body:
                "The fit is pre-set, so it suits the client only as far as a standard size happens to match him, and there is no personalisation of cloth or detail. Buy ready-to-wear for the design and the price, accepting the fit as it comes.\n\nA tailor can take in a waist or shorten a sleeve, but the shoulder and the balance of the coat are fixed at the factory, and those are the two things that decide whether a jacket truly sits. Set that expectation plainly so the client is not disappointed later: the rack gives him the look and the immediacy, not a garment shaped to him. If he keeps returning to the fit in the mirror, treat that as the honest signal to show him the next tier.",
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
                "Made-to-measure starts from an existing factory pattern that is then altered to the client's measurements, with a choice of cloth and details on top. It is the step that lets a client change the fit and make the garment his own.\n\nThis tier fits the client who wants a noticeably better fit and his own choice of cloth, lapel, and lining, but does not want to wait through several fittings or pay bespoke prices. Sell it as the sweet spot of the range: his measurements and his details on a proven pattern, ready in a fraction of the time. A useful framing is that made-to-measure adjusts a trusted pattern to him, so he keeps most of the fit benefit while keeping the cost and the wait sensible.",
            },
            {
              heading: "Its limits",
              body:
                "The measurements are flat, two-dimensional figures taken by a salesman, not a pattern shaped by a cutter, so the fit improves on ready-to-wear but has a ceiling. Choose made-to-measure to adjust the fit and personalise the cloth and details.\n\nFlat figures capture width and length well but cannot fully read posture, a rounded back, a dropped shoulder, or a prominent seat, which is where the ceiling sits. For most clients that ceiling is high enough that they never feel it, and made-to-measure gives them a sharp, personal result. Reserve the move to bespoke for the man whose build sits outside the standard pattern, or who simply wants the finest possible fit and is happy to invest the time it takes.",
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
                "Bespoke is built from a personal pattern drafted for one client and refined over two to three fittings. It gives the best fit, the longest life, and full creative control over every element of the garment.\n\nBecause the pattern is cut for one man and corrected at each fitting, it can be shaped around his exact posture and proportions in a way no factory block reaches. That is why bespoke suits the connoisseur who knows what he wants, the client who is genuinely hard to fit, and the milestone commission such as a wedding or a signature business suit meant to last for years. Present it as an investment in fit and longevity rather than simply the top of the price list, so the value is understood before the number is.",
            },
            {
              heading: "Its trade-offs",
              body:
                "That quality takes time and costs more, since the work is done by hand to one body across several appointments. Reach for bespoke when the client wants the finest fit and the highest quality and is happy to wait for it.\n\nBe straight about what the money and the weeks buy: hand craft, a pattern kept on file for the next commission, and a garment that can be adjusted and will outlast several off-the-rack suits. Never undersell that value to a man who clearly wants the best, and never push it on someone whose need is simpler and sooner. Set the timeline and the number of fittings honestly at the outset, because a client who knows what to expect waits happily, while a surprised one feels the delay.",
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
                "Hold a simple map in your head: ready-to-wear for design and price, made-to-measure to change the fit and personalise, bespoke for the best fit and quality. Say it plainly and the client understands the ladder in a sentence.\n\nOffer the ladder out loud early, because a client who can see all three rungs trusts that you are guiding him rather than steering him upward for the sake of it. Then place him with one or two questions about timeline, budget, and how particular he is about fit, and the right tier usually names itself. Keep the language this plain at the counter, and a first-time visitor grasps in one breath a distinction that many shops never bother to explain.",
            },
            {
              heading: "Honesty sells",
              body:
                "Never oversell a tier the client does not need, and never undersell the value of bespoke to someone who wants the best. Matching the person to the right level builds the trust that brings them back.\n\nThe single sale is worth far less than the client who returns for his next three suits, and nothing earns that loyalty faster than the sense that you told him the truth about what he needed. Put him in ready-to-wear when that genuinely serves him, and he remembers you when the wedding or the promotion calls for bespoke. Honest placement is not the soft option, it is the commercial one, because a well-matched client comes back and brings others with him.",
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
                "Open by introducing yourself and making the client feel welcome before any selling begins. Ask, in an unhurried way, what has brought him in. A warm, genuine start sets the tone for everything that follows.\n\nRapport comes before the tape and the swatches for a reason: a client who feels welcomed opens up about the occasion, the budget, and the doubts that actually shape a good recommendation. Resist the pull to quote a price or reach for the most expensive cloth in the first minute, because that reads as selling rather than serving. A simple, genuine, what brings you in today, gives you more to work with than any product you could lead with.",
            },
            {
              heading: "Understand the need",
              body:
                "Ask about the occasion, his style preferences, and any specific features he has in mind, such as a particular cloth or cut. Listen more than you speak. The brief he gives you is the foundation of every recommendation.\n\nDraw the brief out with open questions about where the suit will be worn, how often, and what he already owns, then let silence do some of the work while he answers. Listening for what is missing from his wardrobe lets you build toward a coherent set of clothes rather than one more garment that duplicates the last. Every later choice of cloth, cut, and detail traces back to this brief, so the more you understand now, the fewer times you have to reverse course.",
            },
            {
              heading: "Measure with care",
              body:
                "Take his measurements properly, and let the act itself show your commitment to a garment made for him. Accuracy here protects the fit. Visible care here builds confidence.\n\nThe measuring moment is quietly persuasive: a careful, methodical tape tells the client, better than any words, that this garment is being built around him alone. Keep the tape snug but never tight, let him stand naturally rather than bracing, and record each figure as you take it so nothing is trusted to memory. Accuracy protects the fit, and the evident care protects the sale, because a client who sees you take pains believes in the result before he has seen the cloth cut.",
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
                "Show a focused selection of fabrics and explain how each affects drape, durability, and breathability. Relate every option back to where and how he will wear the piece. Cloth is where the garment starts to feel personal.\n\nLay out a handful of cloths chosen for his brief rather than the whole bunch, because a curated few feel like expertise while the full book feels like homework. Explain each in outcomes he can feel: a worsted that stays sharp through a working day, a wool and linen blend that breathes in the heat, a flannel with warmth and depth for cooler travel. Hand him the cloth to touch as you talk, since the drape and weight in his own hand does more to sell the right choice than any description alone.",
            },
            {
              heading: "Discuss the style",
              body:
                "Walk him through the key decisions: single or double-breasted, peak or notch lapel, the button stance. Keep each choice tied to formality, proportion, and ease of wear rather than fashion for its own sake.\n\nTie each decision to the man in front of you: a notch lapel and two-button stance for a versatile first suit, a peak lapel or double-breasted front when he wants presence and can carry it. Keep the reasoning about formality and proportion, not what happens to be in fashion this season, so the suit still looks right in five years. When he is unsure, steer toward the balanced, timeless choice and reserve the bolder options for the client who has the wardrobe and the occasion to justify them.",
            },
            {
              heading: "Recommend, then offer the upgrade",
              body:
                "Make a clear recommendation that fits his needs and budget, and leave a confident path to upgrade if he wants more. Guidance plus a gentle option respects both his wallet and his ambition.\n\nLead with the option that genuinely fits his budget, then present the upgrade as an invitation rather than a push: a finer cloth, a working cuff, a half lining for the heat, each with the reason it might be worth it to him. Naming the recommendation first tells him his budget was heard, which is exactly what earns the right to mention the step up. If he declines the upgrade, let it go gracefully, because the client who never feels pressured is the one who comes back and trades up on his own terms next time.",
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
                "Tell him plainly how the garment will be adjusted to reach the best fit, and how many appointments to expect. Clarity about the process removes anxiety and sets honest expectations.\n\nWalk him through what happens after today: the cloth is cut, a trial is booked, and small adjustments at that trial are a normal part of reaching a clean fit, not a sign that something went wrong. Give him a rough number of appointments and a timeline so the wait feels planned rather than open-ended. A client who understands the process arrives to each fitting relaxed, and that calm is part of what he is paying a tailoring house for.",
            },
            {
              heading: "Be clear on price and payment",
              body:
                "Set out the pricing and any additional charges openly, with no surprises. At Hilton the client pays half in advance, and you give a trial date at the point of sale. Honesty about money protects the relationship.\n\nState the total, the fifty percent taken in advance, and anything extra before he asks, because a client who is surprised by a charge later remembers only the surprise. Hand him the trial date at the same moment you take the deposit, so the money and the promise are tied together in his mind. Clear terms cost you nothing and protect everything: the man who trusts your numbers trusts your advice, and he tells others that Hilton dealt with him straight.",
            },
            {
              heading: "Serve through to delivery",
              body:
                "Answer questions, give status updates, and follow up on trial and delivery dates so nothing slips. The sale ends at delivery. The relationship is only beginning, and service after the order is what earns the next one.\n\nKeep him informed rather than making him chase you: a short update at the trial and again before delivery tells him the garment, and he, are being looked after. Deliver on the date you promised, every time, because a missed date undoes much of the goodwill the fittings built. Then follow up once he has worn it, since that final touch, when nothing is being sold, is what turns a satisfied buyer into a client for life.",
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
                "Reach for plain, confident language. 'For your first bespoke suit, let us keep the foundation timeless and personalise a few details carefully.' Or: 'This gives you the cleanest, most versatile result for business and formal wear.' Calm, specific phrasing makes a nervous client feel safe.\n\nKeep a few of these lines ready for the moments a client hesitates, and choose the one that meets his worry: for the man afraid of looking overdressed, this gives you the cleanest, most versatile result; for the man tempted to add too much, if you want a little character without going bold, this is the detail to add. The difference these choices make is not only visual, it changes comfort, movement, and how the garment wears through a long day, and saying so reassures a client that you are thinking about his real life. Deliver them calmly and specifically, because vague enthusiasm sounds like selling while a precise, grounded phrase sounds like expertise.",
            },
            {
              heading: "Reasons, not pressure",
              body:
                "Anchor advice to the person. 'My recommendation is based on your build, the occasion, and how often you will wear it.' Never call an option better in every case. Explain why it suits this client, this occasion, this garment, and translate every detail into a clear benefit.\n\nA blanket claim that something is simply the best invites doubt, while a reason tied to his build, his diary, and his wardrobe invites trust, so always show your working. If he pushes toward a choice you would not recommend, explain the trade-off plainly and let him decide, because a client guided by reasons feels respected while one who is pressured feels handled. Close the conversation by summarising the look in plain words, so he leaves picturing the finished suit clearly and certain that the direction is his own.",
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
                "Merino is a fine, soft, breathable wool that wears light and comfortable, making it a year-round workhorse. Cashmere, from the cashmere goat, is softer still and barely there in weight, with rich insulation, which is why it sits at the luxury end.\n\nReach for merino as the safe, versatile recommendation for a client in a warm climate who wants a suit he can wear through most of the year without overheating. Cashmere is the indulgence: extraordinary to the touch and warm for its weight, but delicate and easily crushed, so it earns its place in a jacket, an overcoat, or a blend rather than a suit worn hard every day. Frame the choice by use, because a man buying one workhorse suit is better served by merino, while cashmere rewards the client adding a luxurious piece to an established wardrobe.",
            },
            {
              heading: "Smooth and structured",
              body:
                "Worsted is a tightly woven wool with a smooth surface. Because it is hardwearing and resists sagging, it is the backbone of business suits. Flannel is a soft, brushed wool with a gentle fuzz and warmth, ideal for cooler-weather trousers and suits.\n\nRecommend worsted as the default for a business wardrobe: it holds a press, travels without collapsing, and resists the sag and shine that tire a suit out, which is exactly why it earns daily wear. Flannel trades that crisp resilience for softness and warmth, so it suits cooler months and a gentler, less formal look, though it marks and wears more readily and asks for a little more care. Match them to the client's climate and calendar, worsted for the year-round office suit and flannel for the winter trouser or the softer weekend jacket.",
            },
            {
              heading: "Textured and warm",
              body:
                "Tweed is a heavy, durable wool woven in muted, mixed shades, often plain, twill, or herringbone, and built for jackets and coats. Mohair, from the Angora goat, adds a crisp, lustrous, slightly hairy texture and is usually blended with sheep's wool.\n\nPoint a client toward tweed when he wants a rugged, characterful jacket for cool weather and country or smart-casual wear, not a sharp city suit, since its weight and texture read relaxed rather than formal. Mohair, blended with wool, does the opposite: its crispness and quiet sheen make it excellent for summer-weight suits and evening wear, holding a clean line while breathing in the heat. Reading these two correctly by season and formality keeps a client from putting a heavy country cloth to work in a hot summer, or a lustrous evening cloth to work at a country weekend.",
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
                "Blends combine the strengths of each fibre. Wool with silk adds sheen and softness for dressier suits, while wool with linen and silk gives drape, strength, and breathability that make it excellent for summer. A good blend can also reach textures no single fibre manages alone.\n\nSell a blend as a solution to a specific need rather than a compromise: wool and silk when a client wants a soft, subtly lustrous suit for an event, wool with linen and silk when he needs a jacket that survives the heat without looking limp. Be honest that linen in the mix will relax and crease as the day goes on, and that this softness is part of its character, not a fault, so the right client expects it and enjoys it. Framed this way, a blend lets you solve for heat, sheen, or texture precisely, reaching a hand and a drape no single fibre gives on its own.",
            },
            {
              heading: "Caring for the cloth",
              body:
                "Most fine tailoring wools are best dry cleaned and pressed gently, ironing on the wrong side with a cloth to protect the surface. Wool and cashmere can be hand washed with care but should not be ironed hard. Knowing this lets you advise a client on keeping a garment for years.\n\nPass on the small habits that quietly double a garment's life: rest a suit a day or two between wears, brush it down, hang it on a shaped hanger, and dry clean only when it truly needs it rather than out of routine. Warn against a hot iron straight on the cloth, which glazes and shines the surface, and show the trick of pressing on the wrong side through a damp cloth instead. Offering this care as part of the service tells the client his investment is meant to last, and it is the kind of detail that brings him back.",
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
                "A solid cloth is the most versatile starting point and works for nearly any occasion. Pinstripe sets thin vertical lines into the fabric for a formal, traditional look, most at home in navy or charcoal.\n\nSteer a first or foundation suit to solid navy or charcoal, because it partners with any shirt and tie and never looks like the same suit twice. Reach for pinstripe when a client wants a formal, authoritative business look, and note that the fine vertical lines also lengthen the silhouette, which flatters most builds. Keep the stripe narrow and the ground dark for the office, and save bolder chalk stripes for the man who already owns his plain navy and wants something with more presence.",
            },
            {
              heading: "Checks",
              body:
                "Glen check, also called Prince of Wales check, layers small and large checks for a classic, sophisticated effect, often in grey or brown. Windowpane lays a wider grid across the cloth and reads as more relaxed and distinctive.\n\nOffer Glen check to a client who wants character without shouting, since it reads as sophisticated and moves comfortably from a smart office to a relaxed occasion. Windowpane is the bolder statement, and its grid adds visual width, which makes it a useful friend to a tall or lean build and a heavier presence on the fuller one to handle with care. Guide the scale by the man and the setting: a subtle check for versatility, a wider pane only when he wants to be noticed and has the frame to carry it.",
            },
            {
              heading: "Weave textures",
              body:
                "Herringbone makes a soft V-shaped, zig-zag texture and moves easily between formal and casual. Houndstooth sets small jagged checks that add personality and texture, classic in wool and tweed.\n\nRecommend herringbone to a client who likes the idea of a plain suit but wants a little life up close, because from a distance it reads solid while rewarding a second look. Houndstooth carries more personality and sits happily on a jacket or a tweed, with the scale setting the tone: a fine, tight check stays refined, while a large, high-contrast one becomes a bold statement best kept to separates. Both add texture that catches winter light, so lean on them when a client wants depth and interest without stepping up to an obvious pattern.",
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
                "Navy, charcoal, and mid-grey are the only true business foundations, and a client's first suits should come from here. They are endlessly wearable and quietly authoritative.\n\nBuild a wardrobe in order: navy first, because it flatters nearly every complexion and carries from the office to an evening out, then charcoal for its quiet authority, then mid-grey for versatility. Each of the three partners easily with white and blue shirts and with black or brown shoes, so a client can dress a week from a small, coherent set. When a man asks where to start, this is the answer to give without hesitation, and only once he owns these should you open the conversation to pattern and richer colour.",
            },
            {
              heading: "What to avoid, what reads casual",
              body:
                "Steer clients away from near-black for business, which can look severe and funeral-like. The paler or brighter a cloth, the more casual it reads, so lift the tone only as the occasion relaxes.\n\nReserve black for black tie and funerals, where it belongs, and explain to a client reaching for it that navy or charcoal reads sharper and more flattering for business while black can look stark under office light. The general rule to share is simple: the darker and plainer the cloth, the more formal it looks, and every shade lighter or brighter moves it toward casual. Use that rule out loud to guide him, lifting the tone only as far as the occasion allows, so a boardroom stays dark and a summer wedding earns something softer.",
            },
            {
              heading: "Dressing for the season",
              body:
                "In summer, lean to lighter colours and weights, soft blues, and a little room for pattern, all of which feel cooler. In winter, darker colours, greys, and textured cloths like tweed add warmth and depth.\n\nIn a warm climate the weight of the cloth matters as much as its colour, so pair a lighter shade with a lighter, more open weave and a breathable wool-linen-silk blend to keep a client cool through the day. Save the heavier tweeds, flannels, and deep tones for winter, travel to colder places, and evening warmth, where their weight becomes a comfort rather than a burden. Read the season and the destination together, because the same client may want a featherweight summer suit for home and something with more substance for a European winter trip.",
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
                "Explain fit in three directions: slim for a sharp modern line, tailored for a balanced shape that follows the body without squeezing, and classic for ease and timeless comfort. Tailored suits most clients. Good tailoring shapes the body, it never grips it.\n\nMatch the fit to the frame and the taste: slim for a lean client or one who wants a fashion-forward line, classic for the man who prizes ease, mobility, or a traditional silhouette, and tailored as the balanced default that flatters most. Start every fit conversation with body shape, comfort, and where the suit will be worn, and steer gently away from over-tightness, which looks strained rather than sharp. A reliable line to close on is that the best fit is the one that makes him look clean and feel comfortable from the first minute he puts it on.",
            },
            {
              heading: "Button your style",
              body:
                "Two buttons are the safest, most versatile stance and the right default. One button reads slightly dressier and cleaner for evening, and three feel more traditional and can suit a taller frame. Tie the choice to formality and proportion, not fashion.\n\nRecommend two buttons for the client who wants timeless, do-anything style, one button when he is dressing for evening or a sleeker modern look, and three only when it genuinely suits a taller man's proportions. Keep the fashion history to yourself and connect the choice to formality, body shape, and ease of use, because that is what he can actually feel. A useful summary is that two buttons are the easiest to wear, one button looks dressier, and three feel more classic, so he can picture the character each gives the jacket.",
            },
            {
              heading: "Spell your lapel",
              body:
                "The notch lapel is the versatile standard and the natural first choice. The peak is bolder and more formal and broadens the chest, while the shawl is smooth and rounded and belongs on tuxedos and dinner jackets.\n\nLead with where the suit will be worn: a first business suit almost always wants a notch, while a client dressing for the boardroom or his own wedding is the one to steer toward a peak for its presence. A useful line to offer is that the lapel is the expression of the jacket, notch being versatile, peak more formal, shawl reserved for black tie. Present the peak as a confident upgrade rather than a default, and never let a nervous first-timer reach for a shawl he will rarely have the occasion to wear.",
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
                "Double vents are the most balanced choice, giving easy movement and a clean drape when hands go in pockets. A single vent is simpler and common on ready-to-wear, while no vent is the cleanest but most restrictive. Recommend double vents for most clients.\n\nLean harder on double vents for a client who sits often, drives, or moves through a busy day, because they let the jacket fall back cleanly instead of bunching when he reaches into a pocket or takes a seat. Keep the ventless jacket for a specific formal or stylistic request, since its clean front comes at the cost of comfort and everyday practicality. Put it to him simply: vents affect both how the jacket hangs and how freely he can move, and double vents usually give the best of both standing and walking.",
            },
            {
              heading: "Pick pocket",
              body:
                "Flap pockets are the versatile business standard, jetted pockets are cleaner and dressier for formal and evening wear, and patch pockets feel relaxed and sit well on blazers and summer jackets. Match the pocket to the cloth and the occasion.\n\nDefault to flap pockets for most first-time clients and business suits, offer jetted pockets when a man wants a dressier, minimalist evening look, and reserve patch pockets for blazers, linen, and summer tailoring where a relaxed feel is the point. The guiding idea is that pocket style quietly sets formality, so a formal cloth or a dinner jacket looks best with the cleaner jetted line, while a casual jacket can carry the softer patch. Let the cloth and the occasion decide together, and the pockets will always look of a piece with the rest of the garment.",
            },
            {
              heading: "Ticket pocket and lining",
              body:
                "A ticket pocket is a small extra pocket above the right hip, a quiet heritage flourish offered as an enhancement rather than a default. Lining is the other structure decision: full lining gives structure and durability, while half or unlined construction breathes and feels softer for warm weather.\n\nOffer the ticket pocket to a client who enjoys classic tailored detail and wants something quietly distinctive, and skip it for the man who wants the cleanest, most minimal jacket possible. Let climate lead the lining decision, since it is the one the wearer feels most: full lining for structure, cooler weather, and hard year-round wear, half or unlined for the lightness and breathability that make a summer jacket genuinely wearable. Present the ticket pocket only after he understands the basic pocket style, so it lands as a considered flourish rather than a decision piled on too soon.",
            },
            {
              heading: "Single or double-breasted",
              body:
                "A single-breasted jacket is the everyday default. A double-breasted jacket creates a stronger, more architectural chest and a more formal presence, flattering when cut well and especially on taller frames. Offer it as a confident choice the client must be comfortable wearing.\n\nRecommend double-breasted to a client who wants distinction, structure, and a little more formality, and reassure him it is no longer the preserve of traditional dressers, since many now choose it for business and occasion alike. It flatters taller frames most readily but can suit many builds when the proportions are balanced, so judge the cut on him rather than by a rule. The one thing to confirm is that he is comfortable wearing a more noticeable silhouette, because a double-breasted jacket asks to be buttoned and carried with a certain confidence, and it should be presented as a choice, not slipped in as a default.",
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
                "Flat fronts look clean and modern and flatter slimmer builds. A single pleat balances elegance with comfort through the thigh and when seated, and a double pleat is fuller and more traditional. Modern pleats, cut correctly, are tailored rather than baggy.\n\nRecommend flat fronts for a trim, contemporary line on a slimmer client, a single pleat for most men who want elegance with real comfort through the thigh and when seated, and a double pleat only when his taste, proportions, and cloth all support the fuller look. Use this decision to ask how he spends his day, since a man who sits for long stretches or needs room to move is well served by a pleat that a flat front cannot give. Reassure the client who fears pleats look dated that, cut correctly, they read as tailored and generous rather than baggy, and it is the poor cut, not the pleat itself, that earned the reputation.",
            },
            {
              heading: "Hem and waistband",
              body:
                "A plain hem is sharp and formal and the only correct finish on a tuxedo, while turn-ups (cuffs) add weight and a classic character that suits flannel and heavier cloth. At the waist, belt loops are familiar, side adjusters look more refined, and a plain waistband is cleanest with braces.\n\nGuide the hem by cloth and formality: plain for formalwear and sleek modern suits, and turn-ups for many business suits, flannels, and heavier cloths where the added weight helps the trouser hang, but never on a tuxedo. At the waist, ask what he actually wears most, because belt loops suit the man who likes a belt and simplicity, side adjusters give a cleaner, more refined top, and a plain waistband is the formal choice that pairs with braces. Linking each finish to his shoes, his cloth, and his daily habit keeps the recommendation to the one he will genuinely use rather than the one that merely sounds smart.",
            },
            {
              heading: "Back pockets and braces",
              body:
                "Two buttoned back pockets give a balanced, practical finish, and one or none reads cleaner. Braces hold the trousers from the shoulders for a clean, unbroken line and need a waistband built for them, usually without belt loops.\n\nKeep the back-pocket advice practical by asking how he uses them: two buttoned pockets suit the man who carries cards and wants symmetry, while one or none gives a cleaner line from behind for the client who prefers minimal. Offer braces to a client who wants the neatest possible front, wears higher-waisted trousers, or simply dislikes a belt tightening at the waist, and explain that they let the trouser hang properly from the shoulders. If he chooses braces, flag early that the waistband must be built for them from the start, usually without belt loops, so the decision is made before the trouser is cut rather than regretted after.",
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
                "A French (clean) front is refined and dressy and suits tailored business shirts, a standard placket is traditional and a touch sportier, and a hidden placket is for formal evening wear. A pocketless front is dressier under a jacket. Add a pocket only when the client needs it.\n\nMatch the front to the shirt's job: a French front for clean, dressy business shirts, a standard placket for casual and versatile everyday wear, and a hidden placket for the sleekest formal evening look. On the pocket, remember that the simpler the front, the dressier the shirt, so a man after a sharp jacket-and-shirt look is almost always better without one. Add a chest pocket only when he genuinely wants the function, and reserve it for casual or overshirt styles rather than the tailored business shirt he wears under a suit.",
            },
            {
              heading: "Collar",
              body:
                "The collar frames the face and sets the formality. Point collars are classic, spread and semi-spread collars are the modern business standard and carry a tie knot well, button-down collars are casual, and wing collars are for black tie only. Read the client's face shape and tie habits.\n\nRead the face and the tie habit together: a spread collar adds width and flatters a narrow face while carrying a larger knot well, and a point collar lengthens and slims a rounder one. Put most business clients in a spread or semi-spread, keep the button-down for smart-casual and sport coats rather than sharp suits, and reserve the wing collar strictly for genuine black tie. A good check is to ask what tie knots he actually ties, since a man who favours a full Windsor needs the collar spread to sit cleanly around it.",
            },
            {
              heading: "Cuffs",
              body:
                "Barrel cuffs are the everyday standard for business and daily wear. French cuffs fold back and fasten with cufflinks for formal occasions, and convertible cuffs offer both. Ask whether the client actually wears cufflinks before recommending French cuffs.\n\nSteer everyday business shirts to barrel cuffs, reserve French cuffs for special occasions and the client who genuinely enjoys cufflinks, and offer convertible cuffs when he wants the option of either without committing. The practical question does most of the work: a man who has never owned a pair of cufflinks will not start now, so a French cuff only leaves him fumbling on the one morning he is already rushing. Frame it as the cuff setting the finishing tone of the shirt, button cuffs practical and easy, French cuffs more formal and expressive, so he picks for the life he actually leads.",
            },
            {
              heading: "Back pleats and tuxedo shirt",
              body:
                "A smooth or darted back is sharpest, while side or box pleats add movement for broader shoulders. A tuxedo shirt should support the dinner jacket, not compete with it: a clean or pleated front, French cuffs, and a dress collar keep the jacket the hero.\n\nChoose the back by build and movement: a smooth or darted back for the cleanest fitted line, and side or box pleats for broader shoulders or a client who reaches forward at a desk or drives often and needs the ease more than he expects. Keep black tie disciplined, since a tuxedo shirt earns its place by supporting the jacket, not by turning into a fashion experiment, so a clean or lightly pleated front, French cuffs, and a proper dress collar are the safe, correct foundation. Offer a more traditional pleated or bib front only to the client who is specifically asking for a fuller black-tie expression, and let the dinner jacket stay the hero.",
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
                "Most sleeves carry three or four buttons. Four feels slightly dressier, and working (surgeon's) cuffs are a true mark of tailoring that should be set with care, since later sleeve alterations get harder. Hand-pick (AMF) stitching along the lapel and pocket edges adds quiet, handmade texture, best kept subtle.\n\nExplain working cuffs with a word of care, because once the buttonholes are cut the sleeve length is far harder to alter, so the fit must be settled before you offer them to a client who values that mark of authenticity. Guide four buttons toward the more traditional, dressier look and three toward a slightly cleaner sleeve, tying the choice to his taste rather than to novelty. On the stitching, encourage elegance over decoration: a fine, quiet pick along the lapel and pockets gives depth and a handmade character, while heavy contrast thread reads as busy and dates quickly, so the best versions are the ones a passer-by barely notices.",
            },
            {
              heading: "The waistcoat",
              body:
                "A waistcoat turns a two-piece into a three-piece and adds structure and presence, useful when the client will remove the jacket at an event. A lined back is lighter for wear under a jacket, while a self-back in the suit cloth looks richer when the waistcoat is worn alone.\n\nThe question that settles the waistcoat is whether he expects to take his jacket off during the event, because a three-piece keeps him looking complete in shirtsleeves while a two-piece can look undone. Recommend it for weddings, presentations, cooler months, and the client who enjoys classic dressing, and keep the two-piece for the man who wants maximum flexibility and warm-weather ease. Let climate and use guide the back: a lined back is lighter and traditional under a jacket, while a self-back in the suit cloth looks richer and stands on its own when the jacket comes off, though in real heat the lighter construction often matters more than the visual richness.",
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
                "Slim follows the body's lines closely for a sharp, modern look and suits lean frames. Tailored is tapered but comfortable and is the right default for most clients. Classic leaves generous room for movement and reads timeless and easy.\n\nMatch the fit to the frame honestly: slim rewards a lean client and flatters a fashion-forward taste, but it strains and pulls on a fuller build and is the wrong place to squeeze a man into a smaller look. Tailored is the safe recommendation for most because it traces the body without gripping, and classic serves the client who prizes comfort, mobility, or a traditional line. Start with his shape and his preference, not with the fit you find sharpest, so the suit flatters the man rather than fighting him.",
            },
            {
              heading: "Comfort is non-negotiable",
              body:
                "Whatever the fit, the garment should flatter without restricting. Guide clients away from over-tightness: tailoring should shape the body, not squeeze it. A man who is comfortable from the first minute wears the suit with confidence.\n\nA suit cut too close betrays itself the moment he moves: it pulls across the chest, strains at the button, and creases where it should lie flat, so tightness reads as a poor fit rather than a sharp one. Comfort is also what lets a man carry himself well, because he stops thinking about his clothes and simply wears them. When a client asks for it tighter than it should be, explain that a clean, shaping fit will look better in the room and last longer on the hanger than one that squeezes.",
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
                "To make a client look taller, keep a close fit and a long, unbroken lapel line, raise the trouser to a higher rise, and minimise interruptions across the body. A lower button stance deepens the V and visually stretches the torso.\n\nThe principle underneath every one of these choices is that the eye travels smoothly up an unbroken vertical line, so anything that keeps the torso and leg reading as one long column adds height. Reinforce it across the whole outfit: trousers close in tone to the jacket, shoes that continue the line rather than cutting it, and a higher rise that lengthens the leg. Apply the toolkit quietly and as a set, since each element is modest on its own but together they lift the silhouette convincingly.",
            },
            {
              heading: "Fine, dark, and quiet",
              body:
                "Choose dark, fine worsted in a solid or subtle pattern, and avoid turn-ups, which cut the leg. The eye travels smoothly up an uninterrupted line, so the fewer the breaks, the taller the silhouette.\n\nDark, fine, solid cloth recedes and lengthens because it offers the eye nothing to stop on, while pale, bold, or heavily textured cloth adds visual weight and cuts the line shorter. Skip the turn-up, the contrast belt, and the wide horizontal check for this client, since each one draws a line across the body and steals height. Put it to him simply, that a clean dark suit in a smooth cloth with an unbroken line is the most reliable way to read taller, and let the wardrobe follow that single idea.",
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
                "For a tall or thin client, do the opposite of lengthening. Add texture, checks, and patterns, use patch or ticket pockets, turn-ups, and a belt to break the vertical line. Treat a thin build like a tall one. These interruptions add visual weight and balance.\n\nThe aim here is the reverse of adding height: introduce horizontal breaks and visual weight so a lean or very tall frame reads as fuller and better balanced rather than stretched. Reach for substantial, textured cloths like tweed and flannel, patterns with width such as windowpane and bolder checks, and details that cut the line, turn-ups, a belt, patch or ticket pockets. Layering also helps, so a waistcoat or a heavier jacket fills the frame, and each interruption you add is doing the opposite job to the lengthening toolkit on purpose.",
            },
            {
              heading: "Larger builds: treat like short",
              body:
                "For a larger client, follow the height-adding principles: a clean, close (not tight) fit, dark fine cloth, a long lapel line, and few interruptions. The aim is a smooth, lengthening silhouette that flatters rather than adds bulk.\n\nThe same lengthening logic that adds height also slims, because a long, uninterrupted line draws the eye up and down rather than across, so dark fine cloth, a clean drape, and minimal breaks all work in the client's favour. Mind the fit especially here: close but never tight, since a suit that strains only emphasises what it is meant to skim, while a touch of room reads far cleaner. Steer him away from bulk-adding details, heavy textures, wide patterns, patch pockets, and turn-ups, and toward the quiet, dark, vertical silhouette that flatters most.",
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
                "The collar frames the face, so balance it against the client's shape. Suggest a spread collar for a narrow face to add width, and a point collar for a rounder face for a slimming effect.\n\nThe idea is balance by contrast: a spread collar opens outward and lends width to a long or narrow face, while a point collar draws the eye downward and lengthens a rounder or fuller one. Judge it against the whole head, since a very wide spread on an already broad face can exaggerate rather than flatter. Offer the collar as the frame that sits closest to the client's face all day, and pick the one that softens his strongest feature rather than doubling it.",
            },
            {
              heading: "Habits matter too",
              body:
                "Beyond face shape, read how the client actually dresses: his tie habits and usual wardrobe. A spread collar carries a larger knot well, while button-down collars belong with sport coats, not sharp business suits.\n\nAsk what he actually wears and how he ties, because the finest collar on paper fails if it fights his habits: a man who favours a full Windsor needs the spread to seat the knot, while one who rarely wears a tie is better in a softer, more casual collar. Keep the button-down for smart-casual and sport coats, and out of the sharp business suit where it undercuts the formality. The best collar is the one that works with how he genuinely dresses, so let his real wardrobe, not an ideal one, settle the choice.",
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
                "A jacket is read across six core points: length, chest, stomach, hip and seat, shoulder, and sleeves. Length sets how the coat falls, chest and stomach shape the body of the garment, hip and seat govern the skirt of the jacket, and shoulder and sleeve settle the frame. Take each point in the same order every time so nothing is missed.\n\nA fixed order is not fussiness, it is insurance: measuring the same way on every client means a figure is never forgotten and the tailor master reads a set he can trust. Understand what each point protects so you can feel when one looks wrong, since the chest and stomach decide whether the coat closes cleanly, the hip and seat keep the skirt from flaring or pulling, and the shoulder sets the whole frame it hangs from. Call and record the numbers in the same unit throughout, because a single figure taken loosely can unpick the balance of the finished jacket.",
            },
            {
              heading: "The arm: biceps and wrist",
              body:
                "Two further points finish the sleeve: the biceps and the wrist. Biceps decides how cleanly the sleeve sits over the arm without pulling, and wrist sets the opening so the cuff breaks correctly over the hand. A sleeve that is right at both ends moves with the client rather than against him.\n\nLeave a little ease at the biceps so the sleeve follows the arm without gripping when he bends it, since a sleeve cut too close there pulls the whole jacket out of line every time he moves. Set the wrist so the jacket cuff ends where a clean half inch of shirt cuff can show, which is the small detail that reads as properly tailored. Take both with the arm relaxed at his side, because a sleeve measured on a raised or tensed arm will sit short and tight once he lets it drop.",
            },
            {
              heading: "Measure with a steady hand",
              body:
                "Keep the tape snug but never tight, and let the client stand naturally rather than holding a pose. Record every figure as you go, in the same unit throughout. The measurements are the whole foundation of the fit, so a minute of care here saves a retrial later.\n\nA figure pulled a touch too tight or read off a braced, unnatural stance carries straight through to a garment that grips or hangs wrong, and the cost lands later as a retrial, a delay, and a client's dented confidence. Take the extra minute now: relax him, take the reading twice where you are unsure, and note it before you move to the next point rather than trusting memory. The care is also quietly persuasive, because a client who watches you measure methodically believes in the fit before the cloth is ever cut.",
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
                "Trousers are read across six points: waist, hip, knee, bottom, length, and thigh. Waist and hip set the seat, thigh and knee shape the leg, bottom fixes the opening at the shoe, and length decides the break. Balance these against the client's build so the trouser sits cleanly without gripping or bagging.\n\nAsk where he actually wears his waistband, since a trouser measured at the natural waist hangs and breaks differently from one worn lower on the hip, and getting this wrong throws off both rise and length. Agree the break at the shoe with him directly, a full, half, or no break, because it is a matter of taste as much as measurement and is awkward to change once cut. Balance the thigh and seat for how he sits and moves, aiming for a trouser that stays clean when he stands and comfortable when he sits, neither gripping nor bagging.",
            },
            {
              heading: "The shirt set",
              body:
                "A shirt is read across four points: collar (the neck), chest, sleeve, and length. Collar is the one felt most day to day, so leave a finger of room for comfort. Chest governs the drape, sleeve sets the cuff at the wrist, and length keeps the shirt tucked through movement.\n\nA finger of room at the collar is not slack, it is the difference between a shirt he wears happily buttoned with a tie and one he loosens by mid-morning, and it also allows for the slight shrink that laundering brings. Set the sleeve so the cuff sits at the base of the thumb and a clean edge shows past the jacket, and cut the length long enough to stay tucked when he raises his arms or leans across a desk. Read the chest for the drape he wants, close for a trim modern look or with a little more room for ease, and match it to the same fit language you used for his suit.",
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
                "Most clients begin by asking what a commission will cost, so prepare a clear estimate first. A good estimate sets honest expectations and opens the order. Once he is comfortable with it, move on to customising the garment and taking the measurements.\n\nThe estimate does more than answer a question, it clears the client's biggest worry so the rest of the consultation can breathe, which is why a good one is often what actually opens the order. Give an honest figure with any extras named up front rather than a low number that grows later, because a surprise at the till costs more trust than a fair price ever costs a sale. Only once he is settled on the estimate should you move into customising the garment and taking measurements, in that order, so the money is agreed before the detail work begins.",
            },
            {
              heading: "Deposit and trial date",
              body:
                "Hilton takes fifty percent in advance at the point of sale, and you give the client a trial date there and then. Record the trial for the tailors a day ahead of the client's appointment, so the garment is ready when he arrives. Clear money terms and a firm date protect the relationship.\n\nBook the tailors' trial a day before the client's own appointment so the garment is finished and pressed when he walks in, never kept waiting while work is still being done. Tie the deposit and the date together in the same moment, because a client who has paid half and holds a firm date feels the commitment is mutual and takes the timeline seriously. Keep the terms plain and written down, since clarity about money and dates is what keeps the relationship easy right through to delivery.",
            },
            {
              heading: "Cutting the fabric",
              body:
                "The tailor master reads the measurements and calls the exact length of cloth and lining to cut from the roll. Always cut about five centimetres extra. That margin gives room for alterations at trial and protects against a cut that leaves no cloth to adjust.\n\nThe five centimetres is cheap insurance against an expensive mistake, because cloth can always be trimmed at the trial but never added back once the roll is cut short. Trust the tailor master's read of the measurements for the length, and confirm the lining is called at the same time so nothing is cut twice or forgotten. Treat the cut as the point of no return it is, checking the figures once more before the shears, since every adjustment still open to you at trial depends on that small extra margin being there.",
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
                "After the fabric is cut, enter the measurements into the system with every element covered and nothing rounded away. The invoice number ties the figures to the payment, and the printout goes to the tailor master to assign the work. A precise entry here is what a good fit is built on.\n\nThe entry becomes the single record the tailor works from, so anything rounded off or left blank here is a fit detail quietly lost between the client and the finished garment. Enter every element in the same units you measured, check it against your written notes before you save, and let the invoice number bind the figures to the payment so nothing is ambiguous later. Take the printout to the tailor master yourself where you can, since a clean, complete hand-off is what a good fit is genuinely built on.",
            },
            {
              heading: "Trials and retrials",
              body:
                "Set the trial with the workload in mind, and follow up with the client on the date and time. If the tailor master calls for a retrial, treat those dates with the same care. Trials are where a good measurement becomes a garment that truly fits, so never let one drift.\n\nSet the date with the workshop's real workload in mind rather than an optimistic promise, and coordinate across branches where needed so the trial holds once booked. Treat a retrial as a normal step toward a clean fit, not a failure, and give its dates the same follow-up and care as the first, because a client reads your diligence here as proof the house takes his garment seriously. Confirm the time with him ahead of each appointment, since a trial that drifts or is missed is where an otherwise good commission quietly loses its momentum.",
            },
            {
              heading: "Finish, deliver, follow up",
              body:
                "When the trial is right, record it and prepare the piece for delivery. Deliver on time, every time, because the promised date is part of the service. Then follow up after the client has the garment. The order closes at delivery, and the relationship carries into the next commission.\n\nRecord the finished trial properly and prepare the garment so it is ready and pressed for the date you gave, because a delivery kept on time is a promise honoured and a delivery slipped undoes much of the goodwill the fittings earned. Deliver the piece well, then reach out once he has worn it a time or two to check it sits as it should, a small gesture made when nothing is being sold. That final follow-up is what turns one commission into a relationship, so the order that closes today opens the door to the next one.",
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
