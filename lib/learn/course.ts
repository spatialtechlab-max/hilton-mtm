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
 *
 * Slide images are mapped by 0-based index within a lesson
 * (/learn/<moduleSlug>-<lessonSlug>-<slideIndex>.jpg). Never insert or reorder
 * a slide in the middle of an existing lesson, or the images mis-map. New
 * slides go at the END of a lesson, or in new lessons or new modules; they
 * simply render without an image, which the player hides cleanly.
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
    "Welcome to Hilton Bespoke. This course turns you from someone who takes measurements into an advisor who turns tailoring into confidence. Work through the nine modules in order, from the advisor mindset through cloth, fabric grading, structure and silhouette, the twenty-five style options, reading the body, and the full estimate-to-delivery workflow. Each module ends with a short quiz, and you need 80 percent to pass. Keep the client, not the sale, at the centre of everything.",
  modules: [
    /* ───────────────────────── 1. The Hilton Standard ───────────────────────── */
    {
      slug: "the-hilton-standard",
      order: 1,
      title: "The Hilton Standard",
      summary:
        "The advisor mindset and the consultation method that define Hilton service. Start with purpose, lead with two strong options, speak in plain outcomes, work a settled sequence, and protect the house.",
      lessons: [
        {
          slug: "the-advisor-mindset",
          title: "The Advisor, Not the Order-Taker",
          slides: [
            {
              heading: "You sell confidence, not cloth",
              body:
                "Your job is to turn tailoring into confidence for the client. Every recommendation should feel knowledgeable, calm, and tied to the person's real life. Measurements and design notes are the mechanics. What the client remembers is feeling understood and well dressed.\n\nA man does not walk into a room thinking about his cloth weight, he thinks about how he is seen, so the feeling you leave him with outlasts any single detail you choose together. Read the person before the garment: a nervous first-timer needs steady reassurance and fewer decisions, while a confident regular wants you to move quickly and respect his time. Set the tone with a simple promise, that your job is to make sure he looks clean and feels comfortable from the first minute he puts the suit on.\n\nHold the whole role in one sentence: you are part stylist and part architect, guiding the client toward what flatters him rather than only what he first asks for. That is the line that separates a Hilton consultant from a shop assistant who fills in an order form. The stylist reads his colouring, his build, and his life. The architect knows what the cloth, the canvas, and the cut can and cannot do. Bring both to every appointment and the client feels the difference before he has chosen a single button.",
            },
            {
              heading: "Start with purpose",
              body:
                "Before any fabric or feature, ask where the garment will live: the office, a wedding, an evening event, travel, daily wear, smart casual. Purpose decides everything that follows. One good question about the occasion is worth more than three about taste.\n\nPurpose is the lever that quietly settles the harder decisions later: a suit built for daily office wear leans toward navy or grey worsted and a notch lapel, while the same client dressing for his own wedding can be steered toward a peak lapel and a richer cloth. Ask how often he expects to wear it as well as where, because frequency separates a versatile foundation piece from a statement worn twice a year. A garment for daily desk work is a different commission from one for a single evening, and the honest answer to how often changes the cloth grade, the colour, and the durability you should aim for.\n\nWhen you know the occasion you can lead with confidence instead of guessing, and the whole consultation moves in one clear direction. Ask the second question too, where in the world he wears it most, because a suit built for a US winter trunk show will fail the same man in the Bahrain heat, and a summer-weight cloth chosen for home will feel thin on a cold European trip.",
            },
            {
              heading: "Lead with two strong options",
              body:
                "Most clients decide better when you offer a confident recommendation and one clear alternative, not a wall of choices. Narrow the field for them. A guided decision reads as expertise. An open menu feels like work.\n\nToo many niche terms and swatches at once leave a client anxious rather than served, so do the narrowing for him and present your pick first with the reason behind it. Frame it as, this is what I would suggest for your build and the occasion, with this second option if you want something a little different. Keep the alternative genuinely distinct so the choice is real, then let him feel he decided rather than that he was sold to.\n\nThe recommendation-plus-alternative habit works at every fork in the consultation, not just the cloth: two lapels, two trouser fronts, two collars. Each time, name your first choice, give the reason in one line, and offer one distinct second. A client who is handed two considered options makes a decision in seconds and trusts it. A client handed the whole book stalls, second-guesses, and often leaves to think about it.",
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
                "Translate every technical term into what it changes for the wearer: cleaner, dressier, lighter, sharper, more comfortable, more versatile. The client does not need the history of the peak lapel. He needs to know it reads as more formal and adds presence.\n\nThe habit to build is to name a feature and immediately attach the benefit, so double vents become the choice that keeps the jacket clean when you sit or slip your hands in your pockets, and a half lining becomes the reason the summer jacket feels lighter on the shoulder. Avoid a run of tailoring terms in a row, which impresses no one and quietly loses the client. If you catch yourself explaining how a detail is made, turn it around and explain what it does for him instead, because comfort, movement, and formality are the only currencies he is really buying.\n\nKeep a short mental list of the outcome words and reach for them constantly: cleaner and sharper for a sleeker line, dressier and more formal for evening and occasion, lighter and cooler for the heat, more comfortable and more versatile for daily wear. Every feature you offer should land in one of those buckets. When you cannot say what a detail does for the man in front of you, that is the sign to drop it rather than name it.",
            },
            {
              heading: "Balance taste with practicality",
              body:
                "A beautiful choice is the wrong choice if the client will not wear it with ease. Match the recommendation to how often he will wear the piece and how he moves through his day. The best option is the one he reaches for again and again.\n\nA cloth he loves in the mirror but will only wear twice a year is rarely the right first commission, whereas a versatile navy earns its place in the wardrobe every week. Ask practical questions about his day, whether he sits for long stretches, drives often, or moves actively, because those answers point to pleats, vents, and cloth weight that keep him comfortable. Never push a trend-driven detail on a man who came in asking for timeless wardrobe value, and when he is set on something impractical, offer it as a considered second piece rather than the foundation.\n\nPracticality is not the enemy of elegance, it is what keeps elegance in service. A delicate Super 150s in a striking colour is a genuine pleasure, but if he wants one suit to wear to the office five days a week, it will shine at the elbows and go at the seat inside a year, and the disappointment lands on the house. Steer him to the durable choice for the workhorse and reserve the delicate, expressive cloth for the garment he wears with care.",
            },
            {
              heading: "Follow the sequence",
              body:
                "Work in a settled order: occasion, then fit, then jacket structure, then pockets and vents, then trousers, then shirt and accessories, then finishing details. Moving from the big decisions to the small ones keeps the client oriented and the consultation calm.\n\nThe order is not arbitrary: each large decision sets the boundaries for the smaller ones, so settling the occasion and the fit first means the pocket, vent, and stitching choices almost recommend themselves. Jumping ahead to a finishing detail before the foundation is set forces you to unpick it later when the purpose turns out to point elsewhere. Hold the client to the sequence gently, and the consultation feels guided and unhurried rather than scattered.\n\nRun the sequence the same way every time so it becomes second nature: occasion tells you formality and cloth, fit tells you the silhouette, structure covers single or double breasted and the canvas, then pockets and vents, then the trouser front and finish, then the shirt collar and cuff, and only then the flourishes like working cuffs and pick stitching. A client who is walked through the decisions in that order leaves feeling led by an expert, not quizzed by a form.",
            },
            {
              heading: "Protect the house",
              body:
                "Hilton service should feel reassuring and unhurried. Guide with expertise and never pressure. Close every design conversation by summarising the look in plain language, so the client leaves certain of the direction.\n\nThe close is where confidence is either sealed or lost, so read the whole look back to him in plain English, the fit, the cloth, the lapel, and the details you settled together, and let him hear that it all hangs together. A client who can picture the finished garment clearly leaves certain, and certainty is what protects both the relationship and the house's name. Pressure has no place here: your authority comes from knowing the craft, not from urging the sale, and a calm, expert summary does more for the next commission than any push ever could.\n\nProtecting the house also means protecting the client from his own worst idea when you can see it coming. If he is set on a combination that will not flatter him, say so plainly and offer the better path, because a man who is quietly talked out of a mistake becomes loyal, while a man sold the mistake blames the tailor when he sees the photographs. Your reputation is built one honest summary at a time.",
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
                "The fit is pre-set, so it suits the client only as far as a standard size happens to match him, and there is no personalisation of cloth or detail. Buy ready-to-wear for the design and the price, accepting the fit as it comes.\n\nA tailor can take in a waist or shorten a sleeve, but the shoulder and the balance of the coat are fixed at the factory, and those are the two things that decide whether a jacket truly sits. The shoulder in particular cannot be moved without effectively rebuilding the jacket, so if the seam falls off the edge of his shoulder or bites into it, no alteration will save the line. Set that expectation plainly so the client is not disappointed later: the rack gives him the look and the immediacy, not a garment shaped to him. If he keeps returning to the fit in the mirror, treat that as the honest signal to show him the next tier.",
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
                "That quality takes time and costs more, since the work is done by hand to one body across several appointments. Reach for bespoke when the client wants the finest fit and the highest quality and is happy to wait for it.\n\nBe straight about what the money and the weeks buy: hand craft, a full-canvas construction that moulds to him over time, a pattern kept on file for the next commission, and a garment that can be adjusted and will outlast several off-the-rack suits. Never undersell that value to a man who clearly wants the best, and never push it on someone whose need is simpler and sooner. Set the timeline and the number of fittings honestly at the outset, because a client who knows what to expect waits happily, while a surprised one feels the delay.",
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
            {
              heading: "Three clients, three tiers",
              body:
                "Work the ladder with three quick examples so the placement becomes instinct. A graduate needs a first suit for interviews next week on a tight budget and has a close-to-standard build. Place him in ready-to-wear, alter the sleeve and waist, and send him out looking sharp the same day. Overselling him bespoke would be a disservice he would remember.\n\nA manager who has been promoted wants two suits that fit properly and his own choice of navy and grey, but he travels and cannot sit through several fittings. Made-to-measure is his rung: his figures and his cloth on a proven pattern, ready in a fraction of the bespoke wait, with a fit he will feel every day.\n\nA client commissioning his wedding suit, or a hard-to-fit man with a dropped shoulder and a prominent seat, belongs in bespoke. He wants the finest fit and the longest life, the pattern kept on file for the next commission, and he is happy to invest the weeks. Name the rung, give the one-line reason, and let each man feel placed rather than pushed.",
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
        {
          slug: "the-nine-step-method",
          title: "The Nine-Step Method",
          slides: [
            {
              heading: "The nine steps in order",
              body:
                "Every Hilton consultation follows the same nine steps, and running them in order is what makes a first-timer feel expertly handled. One, greet the client and build rapport. Two, understand the need: occasion, style, and any feature he already has in mind. Three, take his measurements with care. Four, present a focused selection of cloth and explain drape, durability, and breathability. Five, discuss the style: single or double breasted, peak or notch, the button stance.\n\nSix, make a clear recommendation for his needs and budget, then leave an honest path to upgrade. Seven, explain the fitting process and how many appointments to expect. Eight, set out the pricing and payment openly, take the fifty percent deposit, and hand over the trial date. Nine, serve through to delivery and follow up afterwards.\n\nThe steps are not a script to recite, they are a track that keeps you from skipping the parts that build trust. Rapport before selling, the brief before the cloth, the recommendation before the upgrade, the money stated plainly before he asks. Skip a step and you feel it later as a client who is uneasy about the price, or unsure what he agreed to.",
            },
            {
              heading: "Why the order protects the sale",
              body:
                "Selling a tailored suit is not about the sale, it is about building a relationship that brings the client back for the next three commissions. The nine steps are ordered so that each one earns the right to the next. You cannot take a good brief from a man who is not yet at ease, so rapport comes first. You cannot recommend cloth well until you know the occasion, so the brief comes before the swatches.\n\nThe measuring step does double duty: it protects the fit and it quietly proves your care, so it sits early, before the selling. The recommendation comes before the upgrade so the client hears that his budget was respected, which is exactly what earns the right to mention a finer cloth or a working cuff.\n\nThe last steps are where loyalty is won or lost. Clear money terms and a firm trial date at the deposit, honest updates through the make, delivery on the promised day, and a follow-up when nothing is being sold. Do all nine well and the man does not just collect a suit, he adopts a tailor.",
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
        "Cloth carries most of what a client feels and a passer-by notices: warmth, weight, drape, and formality. Knowing the main wools, blends, weaves, patterns, colours, and the suit and shirt fabrics lets you steer a client to a fabric that fits the season and the occasion.",
      lessons: [
        {
          slug: "the-wools",
          title: "The Wools",
          slides: [
            {
              heading: "Fine and soft",
              body:
                "Merino is a fine, soft, breathable wool that wears light and comfortable, making it a year-round workhorse. Cashmere, from the cashmere goat, is softer still and barely there in weight, with rich insulation, which is why it sits at the luxury end.\n\nReach for merino as the safe, versatile recommendation for a client in a warm climate who wants a suit he can wear through most of the year without overheating. Cashmere is the indulgence: extraordinary to the touch and warm for its weight, but delicate and easily crushed, so it earns its place in a jacket, an overcoat, or a blend rather than a suit worn hard every day. Frame the choice by use, because a man buying one workhorse suit is better served by merino, while cashmere rewards the client adding a luxurious piece to an established wardrobe.\n\nTwo more fine fibres belong in the picture. Alpaca, from the South American animal, is soft, warm, and hypoallergenic, a friend to a client with sensitive skin. Angora, from the angora rabbit, is soft and fluffy with strong insulation and turns up mostly in accessories and blends rather than suiting. Neither carries a suit alone, but knowing them lets you speak to warmth and softness with authority.",
            },
            {
              heading: "Smooth and structured",
              body:
                "Worsted is a tightly woven wool with a smooth surface. Because it is hardwearing and resists sagging, it is the backbone of business suits. Flannel is a soft, brushed wool with a gentle fuzz and warmth, ideal for cooler-weather trousers and suits.\n\nRecommend worsted as the default for a business wardrobe: it holds a press, travels without collapsing, and resists the sag and shine that tire a suit out, which is exactly why it earns daily wear. Flannel trades that crisp resilience for softness and warmth, so it suits cooler months and a gentler, less formal look, though it marks and wears more readily and asks for a little more care. Match them to the client's climate and calendar, worsted for the year-round office suit and flannel for the winter trouser or the softer weekend jacket.\n\nGabardine belongs with these structured cloths too: a medium-weight, hardwearing wool in a close twill weave, sometimes blended, used for coats, jackets, and trousers where a client wants a tough, weather-resistant cloth that still presses sharply.",
            },
            {
              heading: "Textured and warm",
              body:
                "Tweed is a heavy, durable wool woven in muted, mixed shades, often plain, twill, or herringbone, and built for jackets and coats. Mohair, from the Angora goat, adds a crisp, lustrous, slightly hairy texture and is usually blended with sheep's wool.\n\nPoint a client toward tweed when he wants a rugged, characterful jacket for cool weather and country or smart-casual wear, not a sharp city suit, since its weight and texture read relaxed rather than formal. Names carry heritage here: Harris Tweed from Scotland and Donegal from Ireland are the traditional cloths, while modern tweed comes in a wider range of colours and patterns. Mohair, blended with wool, does the opposite: its crispness and quiet sheen make it excellent for summer-weight suits and evening wear, holding a clean line while breathing in the heat.\n\nReading these two correctly by season and formality keeps a client from putting a heavy country cloth to work in a hot summer, or a lustrous evening cloth to work at a country weekend. Shetland wool sits alongside tweed as a coarser, warm, durable cloth for rugged outerwear, one more option for the client dressing for the cold rather than the boardroom.",
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
                "Blends combine the strengths of each fibre. Wool with silk adds sheen and softness for dressier suits, while wool with linen and silk gives drape, strength, and breathability that make it excellent for summer. A good blend can also reach textures no single fibre manages alone.\n\nSell a blend as a solution to a specific need rather than a compromise: wool and silk when a client wants a soft, subtly lustrous suit for an event, wool with linen and silk when he needs a jacket that survives the heat without looking limp. The wool-linen-silk blend is the summer star because it carries the best of all three, the drape and natural wrinkle resistance of wool, the strength of silk, and the breathability of linen, and weavers reach more interesting textures with the blend than with any one fibre alone. Be honest that linen in the mix will relax and crease as the day goes on, and that this softness is part of its character, not a fault, so the right client expects it and enjoys it.\n\nWool and cashmere is the other blend to know: cashmere's silky softness lifts the hand of the cloth and adds warmth for its weight, at home in jackets and overcoats. Framed this way, a blend lets you solve for heat, sheen, warmth, or texture precisely.",
            },
            {
              heading: "Caring for the cloth",
              body:
                "Most fine tailoring wools are best dry cleaned and pressed gently, ironing on the wrong side with a cloth to protect the surface. Wool and cashmere can be hand washed with care but should not be ironed hard. Knowing this lets you advise a client on keeping a garment for years.\n\nPass on the small habits that quietly double a garment's life: rest a suit a day or two between wears, brush it down, hang it on a shaped hanger, and dry clean only when it truly needs it rather than out of routine. Warn against a hot iron straight on the cloth, which glazes and shines the surface, and show the trick of pressing on the wrong side through a damp cloth instead. Offering this care as part of the service tells the client his investment is meant to last, and it is the kind of detail that brings him back.",
            },
            {
              heading: "Reading the care label",
              body:
                "Different cloths ask for different care, and a confident, specific answer marks you out as more than a salesperson. Wool and cashmere: hand wash or dry clean, and avoid ironing. Wool and silk, and the wool-linen-silk blend: dry clean, then a warm iron on the wrong side through a pressing cloth. Gabardine: dry clean, warm iron on the wrong side with a damp cloth.\n\nThe textured and blended cloths are fussier. Mohair: hand wash or dry clean, cool iron on the wrong side with a dry cloth on the face and a damp cloth beside the iron. Tweed: hand wash very carefully or dry clean, warm iron on the wrong side with a damp cloth. Worsted: dry clean and warm iron with a damp cloth, which is why the everyday business suit is the easiest of all to keep.\n\nThe thread running through every one of these is the same, protect the surface. Iron on the wrong side, use a pressing cloth, and never let a hot plate touch the face of fine wool. Give the client the one line that matters for his cloth as you close the order, and you have added a piece of service that costs nothing and is remembered.",
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
                "Herringbone makes a soft V-shaped, zig-zag texture and moves easily between formal and casual. Houndstooth sets small jagged checks that add personality and texture, classic in wool and tweed. Bird's eye scatters a tiny dot across a dark ground for quiet texture that reads as solid from across a room.\n\nRecommend herringbone to a client who likes the idea of a plain suit but wants a little life up close, because from a distance it reads solid while rewarding a second look. Houndstooth carries more personality and sits happily on a jacket or a tweed, with the scale setting the tone: a fine, tight check stays refined, while a large, high-contrast one becomes a bold statement best kept to separates. Bird's eye is the safe way to add interest to a business suit, since its subtle dotted texture in navy or charcoal keeps the formality while lifting the cloth off flat.\n\nAll three add texture that catches winter light, so lean on them when a client wants depth and interest without stepping up to an obvious pattern.",
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
                "In summer, lean to lighter colours and weights, soft blues, and a little room for pattern, all of which feel cooler. In winter, darker colours, greys, and textured cloths like tweed add warmth and depth.\n\nIn a warm climate the weight of the cloth matters as much as its colour, so pair a lighter shade with a lighter, more open weave and a breathable wool-linen-silk blend to keep a client cool through the day. Lighter tones like beige and light grey reflect the sun and read summery, while blue in every shade from sky to navy is both cooling and easy to wear. Save the heavier tweeds, flannels, and deep tones like charcoal and navy for winter, travel to colder places, and evening warmth, where their weight becomes a comfort rather than a burden.\n\nRead the season and the destination together, because the same client may want a featherweight summer suit for home and something with more substance for a European winter trip. Colour and cloth weight are two dials on the same instrument, and you turn them together.",
            },
          ],
        },
        {
          slug: "suit-types-and-occasions",
          title: "Suit Types and Occasions",
          slides: [
            {
              heading: "The main types of suit",
              body:
                "A client uses the word suit for several different garments, so know them precisely. The single-breasted suit, one row of buttons down the front, is the everyday default. The double-breasted suit, two rows of buttons with an overlapping front, reads more formal and architectural. The three-piece adds a matching waistcoat to the jacket and trousers for a more complete, layered look.\n\nAt the formal end sit the evening and ceremonial garments. The tuxedo, or dinner jacket, carries a satin or grosgrain lapel and a satin stripe down the trouser, worn for black tie. The dinner suit is its close cousin with silk or satin lapels. The morning suit is a formal daytime garment for weddings and daytime ceremony, with a tailcoat, striped trousers, and a waistcoat.\n\nThe rest describe purpose or cut rather than construction: the business suit, conservative and understated for professional settings; the casual suit in lighter cloth for summer and relaxed occasions; the slim-fit suit cut close to the body for a modern line; and the bespoke suit, made to one client's measurements and taste. Naming the right one for the occasion is half the recommendation.",
            },
            {
              heading: "Matching the suit to the occasion",
              body:
                "Occasion sets the register, so learn the common ones. A wedding as a guest or a member of the party calls for a suit, dark and formal for a formal wedding, lighter colours and a little pattern permitted at a relaxed one. A job interview is served by a clean, conservative suit that says the client takes the day seriously. A business meeting, especially with clients, expects a well-cut suit that lends authority.\n\nThe solemn occasions have their own code. A funeral asks for dark colours as a sign of respect, black traditionally but charcoal and navy equally correct. Galas and charity balls often specify black tie, which means a tuxedo or a very dark suit with a bow tie. Graduations, ceremonies, and court appearances all call for a dark suit that reads as respect for the occasion and the people in the room.\n\nWhy a man wears a suit at all is worth holding in mind, because it shapes how you sell one. Professionalism and authority in the workplace, respect at formal and solemn events, a thread of tradition, and plain self-expression and confidence. When you understand what the suit is doing for him, you recommend the cloth, colour, and cut that does it best.",
            },
            {
              heading: "Building the wardrobe, not the garment",
              body:
                "The strongest consultations build a wardrobe over time rather than selling one isolated garment. Start a new client on the foundations: a navy and a charcoal in worsted, versatile enough for the office, a wedding, and an evening out. Those two carry ninety percent of a working man's needs and never look tired.\n\nFrom there, read the gaps. A man with two business suits and a wedding coming up needs a peak-lapel or three-piece statement, not a third navy. A man who travels needs a hard-wearing high-twist cloth that resists the suitcase. A man moving into a smart-casual office needs a sports jacket he can wear with grey trousers or chinos, which we cover in its own lesson.\n\nAsk what he already owns before you recommend, so each new commission completes the set rather than duplicating it. A client who trusts you to build his wardrobe piece by piece is a client for a decade, and he sends his colleagues and his sons.",
            },
          ],
        },
        {
          slug: "shirt-and-cotton-fabrics",
          title: "Shirt and Cotton Fabrics",
          slides: [
            {
              heading: "The shirt cottons",
              body:
                "A bespoke shirt deserves the same fabric fluency as a suit. Poplin is a tightly woven cotton with a smooth surface and a subtle sheen, lightweight and breathable, the crisp default for a dress shirt. Oxford is thicker and more durable with a basket-weave texture, a touch more casual, at home under a sports jacket. Twill has a diagonal weave, a little heavier with a soft sheen, and drapes smoothly.\n\nThe finer cottons carry the luxury shirts. Pima is an extra-long staple cotton that spins into a soft, silky cloth, and Egyptian cotton, another long-staple fibre, gives a soft, durable, lustrous shirt at the top of the range. For a client who wants the best shirt to sit under a bespoke suit, these are the names to reach for.\n\nThe casual and seasonal cottons round it out. Chambray is a lightweight cotton that looks a little like denim and dresses up or down. Flannel is soft and brushed with a napped surface, warm for winter shirts. Linen is the breathable summer cloth, cool and light, with the honest caveat that it wrinkles, which is part of its character rather than a flaw.",
            },
            {
              heading: "Shirt patterns and formality",
              body:
                "Read shirt patterns by formality the same way you read suiting. Solid white and solid light blue are the two most versatile and the correct foundation, appropriate for almost any formal occasion and a partner to any suit and tie. Stripes come next, with fine pinstripes and slightly wider Bengal stripes the classic dress choices.\n\nChecks read a step more casual: small checks like a fine gingham hold more formality than large ones, and a bold check belongs with a sports jacket rather than a formal suit. Woven textures give quiet interest without pattern: herringbone and twill weave subtle depth into the cloth, dobby sets a small geometric figure for a shirt that works formal or casual, and jacquard raises a pattern into the weave for the dressiest woven shirts, at home at weddings and formal events.\n\nGuide the client the same way every time: solid for the workhorse, stripe for variety within the office, check and texture as he moves toward smart casual. The pattern should never outshout the suit it sits under, so keep the ground quiet and let the tailoring lead.",
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

    /* ────────────────── 5. Fabric Mastery & Climate (NEW) ────────────────── */
    {
      slug: "fabric-mastery-climate",
      order: 5,
      title: "Fabric Mastery & Climate",
      summary:
        "Beyond naming a cloth, a Hilton advisor explains why it suits the client's life and location. The Super wool grading system, the fabrics that work in heat and cold, and the discipline of steering a client to the right grade turn fabric knowledge into genuine consulting.",
      lessons: [
        {
          slug: "the-super-system",
          title: "The Super Wool Grading System",
          slides: [
            {
              heading: "What the Super number means",
              body:
                "The Super number, printed on a cloth as Super 120s or Super 150s, measures the fineness of the individual wool fibre. The higher the number, the finer the yarn, which gives a silkier feel and a more beautiful drape. It also, and this is the part clients rarely know, makes the cloth more delicate and more prone to wrinkling.\n\nSo the Super number is a dial with two ends, not a simple ladder of better and better. Turn it up and you gain fineness, softness, and drape. Turn it up too far for the use and you lose durability and wrinkle resistance. The consultant's job is not to sell the highest number, it is to match the number to how the client will actually wear the garment.\n\nHold the whole system as three bands: 110s to 120s for durability, 130s to 140s for the balance of luxury and durability, and 150s to 160s and above for the finest, most delicate cloths. Learn what each band is for and you can place any client in seconds.",
            },
            {
              heading: "The workhorse and the sweet spot",
              body:
                "Super 110s to 120s is the durable band. It resists wrinkling, holds its shape, and takes daily wear and travel without complaint. This is the honest recommendation for a man buying one or two suits to wear to the office five days a week, or a suit that lives in a suitcase. It is not the softest cloth in the room, but it is the one that still looks sharp after a year of real use.\n\nSuper 130s to 140s is the sweet spot, the band where luxury and durability meet. The cloth feels noticeably finer and drapes beautifully, yet it holds up well enough for executive daily wear and for events. When a client wants something that feels special but still earns regular wear, this is the band to lead with, because it gives most of the luxury of the higher grades without the fragility.\n\nGuide by use. If he wants one suit that does everything, 120s. If he wants a daily suit that feels like a reward and can carry an important meeting or an evening event, 130s to 140s. Naming the band with its reason tells the client you are protecting his investment, not just selling up.",
            },
            {
              heading: "The luxury band and its caveat",
              body:
                "Super 150s to 160s and above is the luxury band: extremely fine, lightweight, and beautiful in the hand, the cloth of special occasions and tuxedos. It drapes like liquid and feels extraordinary. It is also delicate and prone to wrinkling, and it wears fastest at the points of stress, the elbows and the seat.\n\nThat caveat is the whole point of the conversation. A client who reaches for 150s because it feels the softest on the roll needs to hear, kindly, that softness on the finger and durability in daily wear pull in opposite directions. Reserve the 150s and above for the garment worn with care and rotated, not the suit worn hard every day.\n\nThe rule to carry: higher number means finer yarn, which means silkier and better draping but less durable and more wrinkle-prone. Say it in one line to any client comparing two cloths, and you turn a vague preference for soft into an informed choice about how he will live in the suit.",
            },
          ],
        },
        {
          slug: "fabric-by-climate",
          title: "Selecting Fabric by Climate",
          slides: [
            {
              heading: "Ask where he wears it most",
              body:
                "Before you name a cloth, ask the one question that decides everything: where does he intend to wear this garment the most? A suit crafted for a US winter trunk show will fail the same client when he wears it in the Bahrain heat, and a featherweight summer cloth chosen at home will feel thin on a cold trip abroad.\n\nHilton dresses clients across very different climates, from the heat and humidity of Bahrain and the US summer to the cold of the US and European autumn and winter. The same man may need both, so read his life, not just the season outside the window. A client who splits his year across two climates is a candidate for two different cloths, and saying so is good advice, not upselling.\n\nOnce you know where the garment lives, the cloth almost chooses itself. Heat points to open weaves and high-twist yarns that move air. Cold points to brushed surfaces and heavier worsteds that trap it. Everything that follows in this lesson is that single question, answered in cloth.",
            },
            {
              heading: "Cloth for heat and humidity",
              body:
                "For hot and humid climates, Fresco and high-twist wools are the ultimate summer business fabric. The open weave lets air move through the cloth, and the tightly twisted yarn naturally resists wrinkling, so the client stays cool and still looks pressed at the end of a long day. When a man needs a business suit for real heat, this is the first cloth to reach for.\n\nLinen and cotton are the breathable naturals, cool and light and honest. The caveat you must set is wrinkling: linen creases as the day goes on, and that is part of its relaxed charm rather than a fault. Tell the client plainly, so he chooses it with open eyes and enjoys the character instead of resenting the crease.\n\nMohair blends round out the hot-weather toolkit. Mohair gives a crisp, slightly stiff drape that stands a little away from the body, and that gap is exactly what keeps the wearer cool. Its quiet sheen also dresses up well for a summer event. Between Fresco, linen and cotton, and mohair, you can dress a client for any warm-climate occasion from the office to the evening.",
            },
            {
              heading: "Cloth for cool and temperate weather",
              body:
                "For cool and temperate climates, flannel is the natural first choice. Its brushed surface traps heat and gives a soft, warm hand, excellent for winter suits and for standalone trousers worn with a jacket. It reads a touch less formal than a crisp worsted and rewards a client who likes depth and softness in his winter clothes.\n\nTweed and heavy worsteds are the structured, warm cloths for the cold. Tweed is rugged and characterful, ideal for a warm sports jacket for country and smart-casual wear. Heavy worsted holds a sharp line while carrying enough weight to keep the chill out, so it suits a structured winter business suit or coat.\n\nThe principle mirrors the hot-weather one. In the heat you want cloth that moves air and stands off the body. In the cold you want cloth that traps air and sits close and warm. Match the client's destination to the right side of that line and he is comfortable in every season, which is the quiet luxury a bespoke house is really selling.",
            },
          ],
        },
        {
          slug: "fabric-in-practice",
          title: "Fabric Advice in Practice",
          slides: [
            {
              heading: "The Super 150s black suit",
              body:
                "A client asks for a Super 150s black suit for daily office wear because, in his words, it feels the softest. Two things are quietly wrong with that request, and your job is to correct the premise gently, without making him feel foolish.\n\nFirst, black is too severe for daytime business. Under office light it reads stark and funereal, and it flatters far fewer men than they expect. Charcoal or navy is sharper, more flattering, and more versatile for the working day. Second, Super 150s is too delicate for daily desk work. It is a special-occasion cloth, and worn hard every day it will wrinkle and wear out quickly at the elbows and the seat.\n\nSo pivot him. Recommend a beautifully tailored Super 120s navy suit for the daily wear he actually described, durable, flattering, and sharp, and reserve the Super 150s for a special-occasion garment or a tuxedo down the line, where its softness and drape are a genuine pleasure rather than a liability. He came in wanting soft and dark. He leaves with a suit that will still look right in two years, and a second commission already seeded.",
            },
            {
              heading: "How to correct a client without losing him",
              body:
                "Correcting a client's request is a skill, and the tone decides whether he feels served or contradicted. Never tell him he is wrong. Agree with what he is really after, the softness, the elegance, the value, then show him the choice that delivers it better than the one he named.\n\nThe pattern is always the same three beats. Acknowledge the instinct: you are right to want a cloth that feels wonderful. Explain the trade-off in plain outcomes: the very softest cloths are also the most delicate, and this one wears daily. Offer the better path with a reason tied to him: for the suit you will wear five days a week, this navy gives you the sharpness and the durability, and we keep the softest cloth for the garment you wear with a little more care.\n\nDone this way, the correction lands as expertise, not resistance. The client keeps his dignity, gets a better suit, and trusts you more for having steered him. That trust is worth far more than the single sale of the cloth he first pointed at.",
            },
          ],
        },
      ],
      /* Provisional placeholder quiz, to be replaced in the quiz redesign phase. */
      quiz: {
        passPct: PASS_PCT,
        questions: [
          {
            q: "What does a higher Super number tell you about a wool cloth?",
            options: [
              "It is heavier and warmer",
              "The yarn is finer and silkier, but the cloth is less durable and more wrinkle-prone",
              "It is always the best choice for a daily suit",
              "It is cheaper to produce",
            ],
            answer: 1,
            feedback: "Higher Super number means a finer yarn: silkier and better draping, but more delicate and wrinkle-prone.",
          },
          {
            q: "Which cloth is the ultimate summer business fabric for hot, humid climates?",
            options: ["Flannel", "Heavy worsted tweed", "Fresco and high-twist wool", "Brushed cashmere"],
            answer: 2,
            feedback: "Fresco and high-twist wools have an open weave for airflow and resist wrinkling in the heat.",
          },
          {
            q: "A client wants a Super 150s black suit for daily office wear. What do you do?",
            options: [
              "Sell it as requested",
              "Steer him to a durable Super 120s in charcoal or navy and reserve the 150s for special occasions",
              "Tell him black is the only professional colour",
              "Refuse the commission",
            ],
            answer: 1,
            feedback: "Black is too severe for daytime business and 150s is too delicate for daily wear. Pivot to a durable navy.",
          },
        ],
      },
    },

    /* ────────────────── 6. Silhouette, Structure & Fit (NEW) ────────────────── */
    {
      slug: "silhouette-structure-fit",
      order: 6,
      title: "Silhouette, Structure & Fit",
      summary:
        "What a client pays for lives inside the jacket and in the way it sits on the body. Canvas construction, the British, Italian, and American silhouettes, the fit markers that tell you a jacket is right, and the anatomy of a trouser give you the language to judge and explain a garment.",
      lessons: [
        {
          slug: "canvas-construction",
          title: "Canvas Construction",
          slides: [
            {
              heading: "What canvas is and why it matters",
              body:
                "The canvas is the inner layer that gives a jacket its shape and life, sitting between the outer cloth and the lining. It is made of horsehair, wool, and cotton, and it is the reason a well-made jacket has a chest that rolls softly and a lapel that curves rather than folds flat. Clients cannot see it, so they rarely understand it, and part of your job is to explain what they are paying for inside the jacket.\n\nThe alternative to canvas is fusing, where the shaping layer is glued to the cloth. Fusing is cheaper and can bubble or delaminate over time. Canvas is stitched, floats with the cloth, and lasts. When a client asks why one jacket costs more than another that looks similar on the hanger, the answer is usually inside it.\n\nThere are two canvas constructions to know, half-canvas and full-canvas, and the difference is how far down the jacket the canvas runs. That single fact decides how the jacket drapes, how it breathes, how long it lasts, and how much it costs.",
            },
            {
              heading: "Half-canvas",
              body:
                "In a half-canvas jacket, the canvas runs from the shoulder down through the chest and then stops, usually around the middle of the torso. It provides structure exactly where structure matters most, across the shoulders and chest that frame the man, while letting the bottom half of the jacket drape naturally from the chest.\n\nThis makes half-canvas an excellent entry point for made-to-measure. The client gets a real, shaped chest and a lapel with life in it, at a more accessible price and with a lighter feel than full-canvas. For many men, especially those buying their first serious jacket, it is the sensible, honest recommendation.\n\nExplain it in outcomes: the structure is built into the part of the jacket everyone looks at, and the skirt hangs clean and soft below. He gets most of the benefit of true canvas construction where it shows, at a price that respects a first commission.",
            },
            {
              heading: "Full-canvas",
              body:
                "In a full-canvas jacket, the canvas runs the whole length of the coat, from the shoulder to the hem. This is the hallmark of true bespoke. Because the canvas floats along the entire front, the jacket moulds to the wearer's body over time, taking on his exact shape the way a good pair of shoes takes the shape of the foot.\n\nFull-canvas also breathes better and lasts longest. The stitched, floating construction lets air move and flex with the body, and there is no glue to fail, so a full-canvas jacket outlives several fused ones and can be adjusted along the way. It is the construction that justifies the top of the price list.\n\nWhen a client is weighing bespoke against a cheaper route, this is the concrete thing he is buying: a jacket that becomes his over months of wear, breathes on a warm day, and is still going years later. Half-canvas gives structure where it shows. Full-canvas gives a garment that lives with the man.",
            },
          ],
        },
        {
          slug: "regional-silhouettes",
          title: "Regional Silhouettes",
          slides: [
            {
              heading: "The British cut",
              body:
                "Clients often use words like structured or soft without knowing exactly what they mean, so learn the three regional silhouettes and clarify what a man actually wants. The British cut, associated with Savile Row, is the structured one. It has padded shoulders, a suppressed waist, a lower button stance, and double vents.\n\nThe effect is authority. The padded shoulder and clean, sculpted chest build a strong frame, the nipped waist adds shape, and the whole silhouette projects presence and formality. This is the cut for the boardroom, for the man who wants his tailoring to command a room.\n\nWhen a client says he wants a suit that looks powerful and sharp, he is usually describing the British silhouette even if he does not have the name. Offer it for business authority and formal occasion, and set the shoulder and waist to build the frame he is asking for.",
            },
            {
              heading: "The Italian cut",
              body:
                "The Italian cut, and the Neapolitan tradition in particular, is the soft, unstructured one. It uses little or no shoulder padding, a lighter canvas, and a higher button stance, and it is built for relaxed elegance rather than hard authority. The signature is the spalla camicia, a shirt-style shoulder where the sleeve is set softly into the jacket with no padding, so the shoulder follows the body's own line.\n\nThe result is lightness and ease. The jacket feels almost like a heavy shirt, moves with the man, and reads as effortless rather than commanding. It suits warm climates, softer occasions, and the client who wants to look elegant without looking armoured.\n\nWhen a client says he finds suits stiff or heavy, or that he wants something more comfortable and modern, the Italian silhouette is often the answer. Explain the trade: less structure means less imposed authority, more comfort and a relaxed, worn-in elegance.",
            },
            {
              heading: "The American cut",
              body:
                "The American cut, the traditional sack suit, is the natural, straight one. It has a natural, unpadded shoulder, a straight fit with little or no waist suppression, and a single vent in the back. It is conservative, comfortable, and boxier than the other two, cut for ease rather than shape.\n\nIt is the most forgiving silhouette and the least sculpted. For a client who wants comfort and tradition over a fitted line, or who dislikes a close, shaped jacket, the American cut is honest and correct. It flatters a fuller build by skimming rather than gripping.\n\nHold the three together as a spectrum: British structured and authoritative, Italian soft and relaxed, American natural and conservative. When a client reaches for a vague word, place it on that spectrum and confirm what he means, so the finished jacket matches the picture in his head rather than the one in yours.",
            },
          ],
        },
        {
          slug: "jacket-fit-markers",
          title: "Jacket Fit Markers",
          slides: [
            {
              heading: "The shoulders",
              body:
                "When you assess a baste fitting or judge a client's current suit, three areas tell you almost everything, and the shoulders come first because they cannot be fixed later. The shoulder seam should end exactly where the client's collarbone meets the shoulder, at the natural edge of the bone.\n\nRead the two failures. If the seam extends past the shoulder, the fabric has nothing to sit on and the shoulder divots, dimpling downward off the edge. If the seam is too short and sits inside the shoulder, the lapels are pulled and bow outward away from the chest. Either one reads instantly as a jacket that does not fit, even to an untrained eye.\n\nThis is why the shoulder is the one measurement ready-to-wear cannot save and made-to-measure must get right. Check it first, check it from the front and the side, and if the seam is not landing on the bone, nothing below it will look correct.",
            },
            {
              heading: "The chest and collar",
              body:
                "The second area is the chest and collar, which together tell you whether the jacket's balance is right. The lapels should lie completely flat against the chest, with no gap or bowing, and the collar should hug the back of the neck closely, staying against the neck even as the client moves, turns, and reaches.\n\nThe fault to hunt for is a collar gap, a space that opens between the jacket collar and the shirt collar or the neck. A gap means the balance is off, the jacket is hanging wrong front to back, and it will never sit clean no matter how sharp the rest looks. Watch it in motion, not just standing still, because a collar can sit closed at rest and spring open the moment the man moves.\n\nFlat lapels and a hugging collar are the sign of a jacket in balance. When you see them hold through movement, the foundation is right and you can trust the rest of the fit.",
            },
            {
              heading: "The button stance and the X test",
              body:
                "The third check is the button stance, judged by the X test. Fasten the top button on a two-button jacket and look at the cloth around it. There should be no deep, X-shaped creases radiating out from the button. Deep pulling lines mean the waist is too tight and the jacket is straining to close.\n\nThe nuance matters here. A slight tension across the button is fine and even desirable for a modern, fitted line, so do not chase a completely slack front. What you are ruling out is the deep X, the pronounced creases that fan out from the button and signal that the jacket is fighting the body rather than shaping it.\n\nRun the three checks in order every time: shoulders on the bone, lapels flat and collar hugging through movement, and no deep X at the fastened button. Together they let you judge any jacket in seconds and explain to a client, in plain terms, exactly why one fits and another does not.",
            },
          ],
        },
        {
          slug: "trouser-anatomy-and-fit",
          title: "Trouser Anatomy and Fit",
          slides: [
            {
              heading: "Flat front versus pleats",
              body:
                "A poor trouser fit ruins a good jacket, so trousers deserve the same care. The first decision is the front. A flat front is clean, modern, and slimming, and it is the right choice for athletic or slender builds who want a contemporary line.\n\nPleats are traditional and, more importantly, functional. A pleat is an accordion of cloth at the waist that expands when the client sits, so it gives room through the hip and thigh without bagging when he stands. This makes pleats the honest recommendation for stouter clients and for men with larger thighs, because a flat front on that build pulls tight and forces the side pockets to flare open.\n\nSo read the body, not the fashion. Flat front for the slim and athletic and for the modern look, single or double pleat for the fuller build and the man who sits for long stretches. A pleat, cut correctly, is tailored and generous, not baggy, and it solves a real fit problem that a flat front cannot.",
            },
            {
              heading: "The break",
              body:
                "The break is the fold of cloth where the trouser leg meets the shoe, and you must settle the client's preference early because it changes the length. There are three, and each has a right use. No break means the hem just touches the top of the shoe with no fold. It is modern and clean, shows a little sock when walking, and needs a tapered leg to look right.\n\nHalf break, or medium break, is a single slight horizontal fold where the trouser rests on the shoe. It is the safest and most classic choice, correct for a standard business suit, and it flatters almost every client. When in doubt, this is the break to recommend.\n\nFull break is one or two deep folds, with the cloth covering the laces and resting on the heel. It reads conservative and older, and it only works with a wider trouser leg, since a deep break on a narrow leg looks like a mistake rather than a choice. Match the break to the leg width and the client's taste, and agree it out loud, because it is awkward to change once the trouser is cut.",
            },
            {
              heading: "Seat and rise",
              body:
                "Two fit markers finish the trouser. The seat should drape cleanly down the back of the leg. If it hugs tight across the seat, the cloth will strain and eventually tear, and if it sags in loose folds, the rise needs adjusting. A clean, skimming seat is the sign of a trouser cut right.\n\nThe rise, how high the trouser sits on the body, is the quiet decision that changes the whole line. A high rise sits at the natural waist near the navel. It elongates the leg, and it keeps the shirt from showing in the gap under the jacket button, which is why bespoke trousers so often sit higher than a client expects. A low rise sits down on the hips, reads casual, and belongs on jeans and chinos rather than a tailored suit.\n\nSo steer the bespoke client toward the natural waist. Explain that the higher rise is not old-fashioned, it is what makes the leg look long and the waistline clean under the jacket. Get the seat draping and the rise at the waist, and the trouser earns the jacket above it.",
            },
          ],
        },
        {
          slug: "the-mismatched-silhouette",
          title: "The Mismatched Silhouette",
          slides: [
            {
              heading: "The stout, broad-shouldered client",
              body:
                "A stout, broad-shouldered client asks for a double-breasted suit in a heavy windowpane check with skinny, flat-front trousers and no break. Every one of those choices, on his build, works against him, and your job is to steer him toward proportion without deflating his enthusiasm.\n\nStart with the trousers, the clearest problem. Skinny trousers under a broad upper body make him look top-heavy, all shoulders and chest on thin legs, the lightbulb shape. The heavy windowpane adds width across a frame that is already wide, and the double-breasted front, with its bulk and horizontal button rows, piles more visual weight onto the middle.\n\nSo pivot the whole outfit toward drawing the eye up and lengthening the line, which is the next slide. The instinct behind his request, wanting to look substantial and well-dressed, is right. The specific choices just need redirecting to flatter the build he actually has.",
            },
            {
              heading: "The pivot to proportion",
              body:
                "Redirect him piece by piece, each with a reason. Move him from double-breasted to single-breasted with peak lapels. Single-breasted takes bulk off the midsection, and the peak lapels sweep the eye upward and outward toward the shoulders, drawing attention up to the frame rather than out to the width.\n\nSwap the heavy windowpane for a solid or a subtle vertical pinstripe. Solids and fine verticals lengthen and slim, while the bold grid of a windowpane broadens. Then fix the trousers: a single pleat gives room through the thigh so the leg no longer looks thin against the upper body, and a half break gives a balanced, classic line rather than the abrupt stop of a skinny no-break trouser.\n\nThe finished recommendation, single-breasted with peak lapels, a solid or pinstripe cloth, a single pleat, and a half break, balances his proportions and makes him look tall and substantial rather than top-heavy. Deliver it as the way to get the powerful, well-dressed look he wanted, and he leaves feeling guided rather than corrected.",
            },
          ],
        },
      ],
      /* Provisional placeholder quiz, to be replaced in the quiz redesign phase. */
      quiz: {
        passPct: PASS_PCT,
        questions: [
          {
            q: "What is the hallmark of full-canvas construction compared with half-canvas?",
            options: [
              "The canvas is glued rather than stitched",
              "The canvas runs the whole length of the jacket and moulds to the body over time",
              "It has no canvas at all",
              "The canvas only sits in the sleeves",
            ],
            answer: 1,
            feedback: "Full-canvas runs shoulder to hem, moulds to the wearer, breathes, and lasts longest. Half-canvas stops at the chest.",
          },
          {
            q: "Where should the jacket shoulder seam end on a well-fitting coat?",
            options: [
              "A few centimetres past the shoulder for room",
              "Exactly where the collarbone meets the shoulder",
              "Inside the shoulder, toward the neck",
              "It does not matter, alterations fix it",
            ],
            answer: 1,
            feedback: "The seam sits on the bone. Past it and the shoulder divots; too short and the lapels bow out.",
          },
          {
            q: "Which trouser break is the safest, most classic choice for a standard business suit?",
            options: ["No break", "Half (medium) break", "Full break", "Never break the trouser"],
            answer: 1,
            feedback: "The half break is one slight fold: the safest classic choice that flatters almost every client.",
          },
        ],
      },
    },

    /* ────────────────── 7. Style Options A to Z ────────────────── */
    {
      slug: "style-options",
      order: 7,
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
                "Two buttons are the safest, most versatile stance and the right default. One button reads slightly dressier and cleaner for evening, and three feel more traditional and can suit a taller frame. Tie the choice to formality and proportion, not fashion.\n\nRecommend two buttons for the client who wants timeless, do-anything style, one button when he is dressing for evening or a sleeker modern look, and three only when it genuinely suits a taller man's proportions. Note the proportion trick: a lower button stance, whether a one-button or a low two-button, deepens the V of the jacket opening and visually elongates the torso, which helps a shorter client look taller. Keep the fashion history to yourself and connect the choice to formality, body shape, and ease of use, because that is what he can actually feel.",
            },
            {
              heading: "Spell your lapel",
              body:
                "The notch lapel is the versatile standard and the natural first choice. The peak is bolder and more formal and broadens the chest, while the shawl is smooth and rounded and belongs on tuxedos and dinner jackets.\n\nLead with where the suit will be worn: a first business suit almost always wants a notch, while a client dressing for the boardroom or his own wedding is the one to steer toward a peak for its presence. The peak does real visual work, sweeping upward toward the shoulder to broaden the chest and narrow the waist, which is why it suits a man who wants to project power and why it pairs so well with a double-breasted front. A useful line to offer is that the lapel is the expression of the jacket, notch being versatile, peak more formal, shawl reserved for black tie. Present the peak as a confident upgrade rather than a default, and never let a nervous first-timer reach for a shawl he will rarely have the occasion to wear.",
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
                "Flap pockets are the versatile business standard, jetted pockets are cleaner and dressier for formal and evening wear, and patch pockets feel relaxed and sit well on blazers and summer jackets. Match the pocket to the cloth and the occasion.\n\nDefault to flap pockets for most first-time clients and business suits, offer jetted pockets when a man wants a dressier, minimalist evening look, and reserve patch pockets for blazers, linen, and summer tailoring where a relaxed feel is the point. A useful thing to know is that the flaps on a flap pocket can be tucked inside to mimic a clean jetted line for an evening event, so one versatile jacket covers both. The guiding idea is that pocket style quietly sets formality, so a formal cloth or a dinner jacket looks best with the cleaner jetted line, while a casual jacket can carry the softer patch.",
            },
            {
              heading: "Ticket pocket and lining",
              body:
                "A ticket pocket is a small extra pocket above the right hip, a quiet heritage flourish offered as an enhancement rather than a default. Lining is the other structure decision: full lining gives structure and durability, while half or unlined construction breathes and feels softer for warm weather.\n\nOffer the ticket pocket to a client who enjoys classic tailored detail and wants something quietly distinctive, and skip it for the man who wants the cleanest, most minimal jacket possible. Let climate lead the lining decision, since it is the one the wearer feels most: full lining for structure, cooler weather, and hard year-round wear, half or unlined for the lightness and breathability that make a summer jacket genuinely wearable. The lining also protects the jacket, absorbing perspiration and giving a smooth layer that lets the coat glide over a shirt, so it earns its place beyond warmth. Present the ticket pocket only after he understands the basic pocket style, so it lands as a considered flourish rather than a decision piled on too soon.",
            },
            {
              heading: "Single or double-breasted",
              body:
                "A single-breasted jacket is the everyday default. A double-breasted jacket creates a stronger, more architectural chest and a more formal presence, flattering when cut well and especially on taller frames. Offer it as a confident choice the client must be comfortable wearing.\n\nRecommend double-breasted to a client who wants distinction, structure, and a little more formality, and reassure him it is no longer the preserve of traditional dressers, since many now choose it for business and occasion alike. It flatters taller frames most readily and adds an illusion of athletic bulk to a slimmer man, but be honest with a client carrying weight at the midsection, because the overlapping front and lower button rows draw the eye to the waist. The one thing to confirm is that he is comfortable wearing a more noticeable silhouette, because a double-breasted jacket asks to be buttoned and carried with a certain confidence, and it should be presented as a choice, not slipped in as a default.",
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
                "Flat fronts look clean and modern and flatter slimmer builds. A single pleat balances elegance with comfort through the thigh and when seated, and a double pleat is fuller and more traditional. Modern pleats, cut correctly, are tailored rather than baggy.\n\nRecommend flat fronts for a trim, contemporary line on a slimmer client, a single pleat for most men who want elegance with real comfort through the thigh and when seated, and a double pleat only when his taste, proportions, and cloth all support the fuller look. Use this decision to ask how he spends his day, since a man who sits for long stretches or needs room to move is well served by a pleat that a flat front cannot give. A pleat is functional as well as traditional, opening like an accordion to give room when he sits and keeping the side pockets from flaring on a fuller thigh, so reassure the client who fears pleats look dated that, cut correctly, they read as tailored rather than baggy.",
            },
            {
              heading: "Hem and waistband",
              body:
                "A plain hem is sharp and formal and the only correct finish on a tuxedo, while turn-ups (cuffs) add weight and a classic character that suits flannel and heavier cloth. At the waist, belt loops are familiar, side adjusters look more refined, and a plain waistband is cleanest with braces.\n\nGuide the hem by cloth and formality: plain for formalwear and sleek modern suits, and turn-ups for many business suits, flannels, and heavier cloths where the added weight helps the trouser hang, but never on a tuxedo. Note the proportion effect too: a turn-up adds a horizontal line low on the leg that anchors a taller client but visually shortens a shorter one, so keep cuffs off the flat-front trousers of a short man. At the waist, ask what he actually wears most, because belt loops suit the man who likes a belt and simplicity, side adjusters give a cleaner, more refined top, and a plain waistband is the formal choice that pairs with braces.",
            },
            {
              heading: "Back pockets and braces",
              body:
                "Two buttoned back pockets give a balanced, practical finish, and one or none reads cleaner. Braces hold the trousers from the shoulders for a clean, unbroken line and need a waistband built for them, usually without belt loops.\n\nKeep the back-pocket advice practical by asking how he uses them: two buttoned pockets suit the man who carries cards and wants symmetry, while one or none gives a cleaner line from behind for the client who prefers minimal. A gentle reminder worth giving is that bespoke trousers drape best when the back pockets are kept empty, since a loaded pocket pulls the seat out of line. Offer braces to a client who wants the neatest possible front, wears higher-waisted trousers, or simply dislikes a belt tightening at the waist, and if he chooses them, flag early that the waistband must be built for braces from the start, usually without belt loops, so the decision is made before the trouser is cut.",
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
            {
              heading: "Collar architectures in depth",
              body:
                "Go deeper than the basics, because the collar is the single most important shirt decision and each architecture has a job. The semi-spread and spread are the versatile workhorses, opening the collar points outward to make room for a medium to large knot like a Half Windsor, and they flatter almost every face shape, which is why most business clients belong here.\n\nThe cutaway, and the extreme cutaway, is the aggressive, modern Italian style. The points sweep back sharply toward the shoulders, which demands a large tie knot to fill the wide opening, and the collar also looks deliberate and elegant worn open with no tie. It suits a client with a narrow or long face, whose features the wide spread balances, and it makes a bolder statement than a client after a conservative look may want.\n\nThe point collar is the traditional, narrow one. Its close points suit a small knot like a Four-in-Hand, and because it draws the eye downward it elongates a wider or rounder face, the opposite job to the spread. The button-down is the outlier, inherently casual, at home in Oxford cloth under a sports jacket or with no jacket at all, and never correct with a double-breasted suit or formal business wear. Match the architecture to the knot he ties and the face he has, and the shirt frames him rather than fighting him.",
            },
            {
              heading: "The Hilton unbranded standard",
              body:
                "Hold one house rule above personal taste: Hilton Bespoke shirts are pure, unbranded elegance. We never place an external brand label or logo on the chest or the cuff. All branding stays strictly on the inside garment tag, hidden against the body where only the wearer knows it is there.\n\nExplain to a client why this is a mark of quality, not an omission. A visible logo announces the label. An unbranded shirt announces the man and the cut, and lets the cloth, the collar, and the fit do the talking. It is the quiet confidence of a garment that does not need to name itself, which is exactly the register a bespoke house should sound.\n\nSo when a client asks where the brand mark goes, the answer is simple and proud: on the inside, where it belongs. Clean chest, clean cuff, and all the character carried in the making rather than the marketing. That restraint is part of the Hilton standard, and it applies across the shirt whatever collar or cuff he chooses.",
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
                "Most sleeves carry three or four buttons. Four feels slightly dressier, and working (surgeon's) cuffs are a true mark of tailoring that should be set with care, since later sleeve alterations get harder. Hand-pick (AMF) stitching along the lapel and pocket edges adds quiet, handmade texture, best kept subtle.\n\nExplain working cuffs with a word of care, because once the buttonholes are cut the sleeve length is far harder to alter, so the fit must be settled before you offer them to a client who values that mark of authenticity. A small insider signal to share: some men leave the last working cuff button undone to quietly show that the garment is genuinely bespoke. On the stitching, encourage elegance over decoration, since a fine, quiet pick along the lapel and pockets gives depth and a handmade character while also keeping the edges flat, whereas heavy contrast thread reads as busy and dates quickly, so the best versions are the ones a passer-by barely notices.",
            },
            {
              heading: "The waistcoat",
              body:
                "A waistcoat turns a two-piece into a three-piece and adds structure and presence, useful when the client will remove the jacket at an event. A lined back is lighter for wear under a jacket, while a self-back in the suit cloth looks richer when the waistcoat is worn alone.\n\nThe question that settles the waistcoat is whether he expects to take his jacket off during the event, because a three-piece keeps him looking complete in shirtsleeves while a two-piece can look undone. Recommend it for weddings, presentations, cooler months, and the client who enjoys classic dressing, and keep the two-piece for the man who wants maximum flexibility and warm-weather ease. Let climate and use guide the back: a lined back is lighter and lets the jacket glide smoothly over it, while a self-back in the suit cloth looks richer and stands on its own when the jacket comes off, though in real heat the lighter construction often matters more than the visual richness.",
            },
          ],
        },
        {
          slug: "the-sports-jacket",
          title: "The Sports Jacket",
          slides: [
            {
              heading: "Sports jacket versus orphaned suit jacket",
              body:
                "A common client mistake is wearing an orphaned suit jacket, the top half of a suit whose trousers have worn out, as if it were a sports jacket. It never quite works, and knowing why lets you offer the better garment. A suit jacket is built to match its trousers exactly, usually in smooth worsted with matching buttons, and on its own it looks like half of something rather than a piece in its own right.\n\nA true sports jacket is a different garment from the ground up. It has softer construction with less padding, so it wears easy and relaxed. It is cut from textured fabrics that read casual and catch the light, tweed, herringbone, linen, and hopsack among them. And it often carries contrasting buttons, in horn, mother of pearl, or metal, that announce it was never meant to match a trouser.\n\nSo when a client reaches for his old suit jacket to dress down, offer him a sports jacket instead and explain the difference in outcomes: soft where the suit is structured, textured where the suit is smooth, and made to be worn with contrasting trousers rather than mourned as a widowed half-suit.",
            },
            {
              heading: "Building contrast",
              body:
                "The whole point of a sports jacket is to be worn with contrasting trousers, so teach the client to build contrast rather than match. A textured navy hopsack jacket sits beautifully over smooth grey worsted trousers or a pair of crisp chinos, because the difference in texture and colour is deliberate and reads as put-together rather than mismatched.\n\nGive him the one rule that keeps it safe: let a single element carry the interest and keep the rest grounded. If the jacket carries a bold pattern like a windowpane check, the trousers and the shirt must stay solid to anchor the outfit, or the whole look becomes noisy. A patterned jacket wants quiet partners.\n\nFrame the sports jacket as the piece that builds a wardrobe rather than a single outfit. It bridges the gap between a full suit and casual wear, lifts chinos or dark denim instantly, and gives a client polish on the days a suit would be too much. Ask what trousers and shoes he already owns, and recommend the jacket that completes the most combinations from what he has.",
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

    /* ────────────────── 8. Reading the Body & Fit ────────────────── */
    {
      slug: "reading-the-body",
      order: 8,
      title: "Reading the Body & Fit",
      summary:
        "A great recommendation starts with reading the person in front of you. Fit type, a few proportion principles, colour and contrast, and the collar for the face let you flatter any build and turn a good cloth into a garment that suits the man.",
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
                "Whatever the fit, the garment should flatter without restricting. Guide clients away from over-tightness: tailoring should shape the body, not squeeze it. A man who is comfortable from the first minute wears the suit with confidence.\n\nA suit cut too close betrays itself the moment he moves: it pulls across the chest, strains at the button into a deep X, and creases where it should lie flat, so tightness reads as a poor fit rather than a sharp one. Comfort is also what lets a man carry himself well, because he stops thinking about his clothes and simply wears them. When a client asks for it tighter than it should be, explain that a clean, shaping fit will look better in the room and last longer on the hanger than one that squeezes.",
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
                "To make a client look taller, keep a close fit and a long, unbroken lapel line, raise the trouser to a higher rise, and minimise interruptions across the body. A lower button stance deepens the V and visually stretches the torso.\n\nThe principle underneath every one of these choices is that the eye travels smoothly up an unbroken vertical line, so anything that keeps the torso and leg reading as one long column adds height. Reinforce it across the whole outfit: trousers close in tone to the jacket, shoes that continue the line rather than cutting it, and a higher rise that lengthens the leg and keeps the shirt from showing under the jacket button. Apply the toolkit quietly and as a set, since each element is modest on its own but together they lift the silhouette convincingly.",
            },
            {
              heading: "Fine, dark, and quiet",
              body:
                "Choose dark, fine worsted in a solid or subtle pattern, and avoid turn-ups, which cut the leg. The eye travels smoothly up an uninterrupted line, so the fewer the breaks, the taller the silhouette.\n\nDark, fine, solid cloth recedes and lengthens because it offers the eye nothing to stop on, while pale, bold, or heavily textured cloth adds visual weight and cuts the line shorter. Skip the turn-up, the contrast belt, and the wide horizontal check for this client, since each one draws a line across the body and steals height. A break-less or half-break trouser hem also helps, ending the leg cleanly at the shoe rather than folding across it. Put it to him simply, that a clean dark suit in a smooth cloth with an unbroken line is the most reliable way to read taller, and let the wardrobe follow that single idea.",
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
                "For a tall or thin client, do the opposite of lengthening. Add texture, checks, and patterns, use patch or ticket pockets, turn-ups, and a belt to break the vertical line. Treat a thin build like a tall one. These interruptions add visual weight and balance.\n\nThe aim here is the reverse of adding height: introduce horizontal breaks and visual weight so a lean or very tall frame reads as fuller and better balanced rather than stretched. Reach for substantial, textured cloths like tweed and flannel, patterns with width such as windowpane and Glen plaid, and details that cut the line, turn-ups, a belt, patch or ticket pockets. Turn-ups in particular anchor the leg and are worth recommending for this build. Layering also helps, so a waistcoat or a heavier jacket fills the frame, and each interruption you add is doing the opposite job to the lengthening toolkit on purpose.",
            },
            {
              heading: "Larger builds: treat like short",
              body:
                "For a larger client, follow the height-adding principles: a clean, close (not tight) fit, dark fine cloth, a long lapel line, and few interruptions. The aim is a smooth, lengthening silhouette that flatters rather than adds bulk.\n\nThe same lengthening logic that adds height also slims, because a long, uninterrupted line draws the eye up and down rather than across, so dark fine cloth, a clean drape, and minimal breaks all work in the client's favour. Reach for dark solids or a subtle vertical pinstripe rather than a heavy windowpane, which only adds width, and use peak lapels to draw the eye up and out toward the shoulders. Mind the fit especially here, close but never tight, since a suit that strains only emphasises what it is meant to skim, and steer him toward the quiet, dark, vertical silhouette with a clean break-less or half-break hem that flatters most.",
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
                "The collar frames the face, so balance it against the client's shape. Suggest a spread collar for a narrow face to add width, and a point collar for a rounder face for a slimming effect.\n\nThe idea is balance by contrast: a spread collar opens outward and lends width to a long or narrow face, while a point collar draws the eye downward and lengthens a rounder or fuller one. The cutaway takes the spread further and suits a distinctly narrow or long face that can carry the wide opening. Judge it against the whole head, since a very wide spread on an already broad face can exaggerate rather than flatter. Offer the collar as the frame that sits closest to the client's face all day, and pick the one that softens his strongest feature rather than doubling it.",
            },
            {
              heading: "Habits matter too",
              body:
                "Beyond face shape, read how the client actually dresses: his tie habits and usual wardrobe. A spread collar carries a larger knot well, while button-down collars belong with sport coats, not sharp business suits.\n\nAsk what he actually wears and how he ties, because the finest collar on paper fails if it fights his habits: a man who favours a full Windsor needs the spread to seat the knot, while one who rarely wears a tie is better in a softer, more casual collar or an open cutaway. Keep the button-down for smart-casual and sport coats, and out of the sharp business suit where it undercuts the formality. The best collar is the one that works with how he genuinely dresses, so let his real wardrobe, not an ideal one, settle the choice.",
            },
          ],
        },
        {
          slug: "colour-and-contrast",
          title: "Colour and Contrast",
          slides: [
            {
              heading: "Dressing to the client's contrast",
              body:
                "A man's own colouring sets how much contrast his clothes should carry, and reading it lets you flatter him with the outfit as a whole, not just the suit. High-contrast clients, for example fair skin with dark hair, look best in high-contrast outfits: a dark navy suit with a crisp white shirt matches the natural contrast of their face and looks balanced and sharp.\n\nLow-contrast clients need the opposite. A man with fair skin and blonde hair, or with dark skin and dark hair, has little contrast between his features, so a stark dark-and-white combination overpowers him. Steer him to monochromatic or low-contrast pairings: a medium grey suit with a light blue shirt, or an olive suit with an ecru shirt, so the outfit sits in harmony with his colouring rather than shouting over it.\n\nSo before you pair a shirt with a suit, glance at the man himself. Match the contrast of the outfit to the contrast of his face, and the whole look reads considered and flattering. Mismatch it, and even a beautiful suit can look slightly off in a way the client feels but cannot name.",
            },
            {
              heading: "Warm and cool undertones",
              body:
                "Undertone is the second half of colour matching. Warm complexions, with olive or yellow undertones, come alive in earth tones, browns, and warm greens, colours that echo the warmth in the skin. Cool complexions, with pink or blue undertones, look best in true blues, greys, and a crisp black, colours that sit cleanly against a cooler skin.\n\nUse undertone to choose between two shades that are both, on paper, correct. Two clients may both need a mid-brown jacket, but the warm-toned man wears a warmer, golden brown beautifully while the cool-toned man is better in a cooler, greyer taupe. It is a small adjustment that makes the difference between a colour that lifts the face and one that drains it.\n\nHold contrast and undertone together as one quick read. First, how much contrast does his face carry, high or low, which sets the pairing. Then, is his undertone warm or cool, which sets the exact shades. Two glances, and you can recommend colours that flatter the man, which is the kind of eye that turns a customer into a client for life.",
            },
            {
              heading: "Colour and pattern for the build",
              body:
                "Colour and pattern also do the work of flattering the build, so tie them back to what you know about proportion. For a stout or broad client, avoid heavy patterns like a thick windowpane that add width, and stick to dark solids or a subtle vertical pinstripe, which lengthen and slim. Peak lapels draw the eye up and out, and a clean, break-less trouser hem elongates the leg.\n\nFor a tall or thin client, do the reverse and use colour and texture to add presence. Heavier, textured cloths like flannel and tweed give bulk, and patterns with width like Glen plaid and windowpane break up the vertical height so the frame reads fuller rather than stretched. A ticket pocket and turn-ups add the horizontal interruptions that anchor a long leg.\n\nSo colour is never chosen in isolation. It answers to the man's colouring for harmony and to his build for proportion at the same time. A dark solid slims the broad client and a textured check fills out the lean one, and the same instinct that reads his skin reads his frame.",
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

    /* ────────────────── 9. The Fitting & Measurement Process ────────────────── */
    {
      slug: "the-fitting-process",
      order: 9,
      title: "The Fitting & Measurement Process",
      summary:
        "A garment is only as good as the numbers it is built from and the order that carries it to the client. Learn the jacket, trouser, and shirt measurement sets, then the workflow from estimate to delivery: deposit, trial date, cutting with a margin, accurate entry, trials, finishing, follow-up, and the shop discipline behind it.",
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
                "After the fabric is cut, enter the measurements into the Hilton Tailor Made database with every element covered and nothing rounded away. The invoice number ties the figures to the payment, and once it is entered the amount collected shows against the order. Take the printout to the tailor master to assign the work. A precise entry here is what a good fit is built on.\n\nThe entry becomes the single record the tailor works from, so anything rounded off or left blank here is a fit detail quietly lost between the client and the finished garment. Enter every element in the same units you measured, check it against your written notes before you save, and let the invoice number bind the figures to the payment so nothing is ambiguous later. Take the printout to the tailor master yourself where you can, since a clean, complete hand-off is what a good fit is genuinely built on.",
            },
            {
              heading: "Trials and retrials",
              body:
                "Set the trial with the workload in mind, and follow up with the client on the date and time. If the tailor master calls for a retrial, treat those dates with the same care. Trials are where a good measurement becomes a garment that truly fits, so never let one drift.\n\nSet the date with the workshop's real workload in mind rather than an optimistic promise, and coordinate across branches where needed so the trial holds once booked. Treat a retrial as a normal step toward a clean fit, not a failure, and give its dates the same follow-up and care as the first, because a client reads your diligence here as proof the house takes his garment seriously. Confirm the time with him ahead of each appointment, since a trial that drifts or is missed is where an otherwise good commission quietly loses its momentum.",
            },
            {
              heading: "Finish, deliver, follow up",
              body:
                "When the trial is right, record it in the register and prepare the piece for delivery. Deliver on time, every time, because the promised date is part of the service. Then follow up after the client has the garment. The order closes at delivery, and the relationship carries into the next commission.\n\nRecord the finished trial properly and prepare the garment so it is ready and pressed for the date you gave, because a delivery kept on time is a promise honoured and a delivery slipped undoes much of the goodwill the fittings earned. Deliver the piece well, then reach out once he has worn it a time or two to check it sits as it should, a small gesture made when nothing is being sold. That final follow-up is what turns one commission into a relationship, so the order that closes today opens the door to the next one.",
            },
          ],
        },
        {
          slug: "the-shop-workflow",
          title: "The Shop Workflow",
          slides: [
            {
              heading: "Invoices and bill books",
              body:
                "Hilton Bespoke runs three customer bill books, and using the right one keeps the accounts and the VAT clean. The Main Bill Book is for suits, shirts, trousers, waistcoats, and stitching-only invoices, the everyday record for a commission. The Alteration Bill Book is used only for alteration charges. The Accessories Textile Bill Book covers accessories and fabric sales, for example shoes, ties, and lengths of cloth sold on their own.\n\nAll three carry a VAT number and must be handled carefully, because they are the official record of the sale. There is also a fourth book, the Textile book, which has no VAT number and is for internal use only. It must never be used for a customer transaction, since a customer sale on a non-VAT book is an accounting error waiting to be found.\n\nSo pause before you write, and pick the book that matches the transaction. Garment or stitching goes in the Main book, an alteration in the Alteration book, an accessory or a cloth sale in the Accessories Textile book, and nothing customer-facing ever in the internal Textile book.",
            },
            {
              heading: "Stock, fabric rolls, and the point of sale",
              body:
                "The stock discipline protects both the fit and the accounts. Maintain an accurate stock report on the fabric rolls and on stock coming in and going out, so the shop always knows what cloth it holds. Every roll carries a small paper affixed to it with the selling price, the shade, the code, and a note of the last length used, which is what lets you cut and price with confidence.\n\nAt the counter, the point-of-sale machine is where the billing information is entered, so enter it accurately at the moment of sale rather than reconstructing it later. New arrivals and fresh fabric rolls go straight into the stock register, because a roll that is not logged is a roll that cannot be found or priced when a client asks for it.\n\nHold the proforma for stock in fabric in mind as the fields that matter for each roll: the code, the shade, the metres held, and the selling price. Keep those four current and the whole cloth inventory stays honest, which is what stands behind every estimate and every cut.",
            },
            {
              heading: "Branch inter-transfers",
              body:
                "Hilton Bespoke runs across branches, Zinj, Manama, and Diplomat among them, and cloth and finished garments move between them as inter-transfers. A roll needed for a client at one branch may sit at another, and a garment may be trialled where the client is most easily seen, so stock does not stay still.\n\nEvery inward and outward branch transfer must be recorded accurately in the books and files, because an unrecorded transfer is stock that has vanished on paper even though it is safe on a shelf across town. When you send cloth or a garment to another branch, log it out, and when you receive one, log it in, so both branches agree on where everything is.\n\nCoordinate trials across branches the same way. When a client can be seen at a nearer branch, arrange it and keep the dates aligned so the trial holds. The client experiences one house wherever he walks in, and the honest, up-to-date transfer records are what make that single seamless service possible behind the scenes.",
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
