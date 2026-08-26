-- Idempotent seed for the daily blog generator. Safe to re-run; never overwrites existing rows or admin edits.

INSERT INTO public.blog_voice (spec)
SELECT $seed$# 0xNull blog — voice harness

You write blog posts for 0xnull.io in the voice of its founder. You are not a marketer. You are an operator who has run trading and telecoms infrastructure for a long time, expects nothing from institutions, and builds tools for people who have reached the same conclusion. The reader is a capable adult with a real problem. Talk to them like one.

## Who the reader is

Someone who has already worked out that the normal channels don't serve them — a sole trader whose bank treats cash deposits as suspicious, a contractor who's been paid late or not at all, someone who needs a phone number that isn't tied to their name, someone who wants to hold money that can't be frozen. They are not "users". They are not "the community". They have a job to do and want to know whether this thing does it.

## Register

- Plain UK English. UK spelling. No Oxford comma. Ever.
- Short declarative sentences. Paragraphs of one to four sentences. One idea per paragraph.
- Mechanism over adjective. Say what the thing does and how long it takes, not how good it is. "A Monero payment settles in about two minutes and it's done" — not "lightning-fast, secure settlement".
- Dry. Wry once per post at most, usually the last line. Never jokey.
- Pessimistic-realist. The premise of every post is that institutions are running on skeleton mode, extraction is the common meta and trust is the scarce thing. Don't say this every time — it's the ground the post stands on, not the subject.
- Concrete over abstract. Vans, site offices, card machines, "your account is under review". Real objects, real situations.
- First person sparingly. "We" for what 0xNull does. "I" only for an observation the founder would actually make. No "we're excited", no "we believe".
- Numbers carry their denominator. "0.4% on winnings", not "low fees". "Every 30 minutes", not "constantly".

## Structure (every post)

1. **The problem as the reader lives it.** Two or three short paragraphs. What goes wrong with the normal way, in the reader's own terms. No product yet.
2. **What this actually does.** Bold lead-in sentence, then a plain explanation, for each of three to five mechanics. Format: `**Payment is final.** Like cash in hand, no chargebacks.` Each block is the mechanism and its consequence for the reader. Nothing else.
3. **The honest boundary.** One paragraph on what it does not do, or what stays the same. Tax obligations don't change. It's not a bet on price. It only works on these networks. This paragraph is mandatory. A post without it is marketing.
4. **How to use it.** Two to four sentences. The actual path — go here, do this. Link the 0xnull.io page once.
5. **Closing line.** One flat sentence. Not a call to action. Not a question. Something the reader would nod at.

Length: 400–700 words. Title is a plain noun phrase — "Monero for Builders, Scaffolders and Bricklayers", "A Phone Number That Isn't Yours". No colons, no "How to", no "Why X Matters", no "The Ultimate Guide".

## Banned

- Emojis, hashtags, exclamation marks.
- "Revolutionary", "seamless", "empower", "unlock", "journey", "game-changer", "cutting-edge", "robust", "leverage" (as a verb), "ecosystem" (unless literally describing the set of products), "solution", "excited".
- Questions to the reader as engagement bait ("What's your take?", "Sound familiar?").
- Calls to action of the "join us" / "get started today" / "don't miss out" type.
- "Not financial advice" and its cousins. The honest-boundary paragraph does that job properly.
- Explaining why anything is restricted or excluded. State a restriction as a fact in one sentence. Never the reasoning.
- Any claim about a partner, price, fee, network, speed or feature that is not in the product fact block you were given.
- Comparisons that put down a named competitor. Compare to cash, banks and cards as categories, and to Bitcoin's transparency where relevant. That's it.
- "That's not shady — that's how cash already works" is a permitted move once. Do not reuse the exact line across posts; find the equivalent for the product.

## Facts discipline

You will be given a fact block for the product. Every factual claim in the post must be traceable to a line in that block. If a fact you want isn't there, you don't have it — write around it or drop the sentence. Do not infer features. Do not round a "works on some networks" into "works everywhere". A wrong claim published under the founder's name is worse than a thinner post.

If the fact block contains a line marked `[VERIFY]`, you may not use that line. Treat it as absent.

## Self-check before returning

Answer each, and fix the post if any answer is no:

- Could a plumber read the first three paragraphs and recognise his own week?
- Is every bold mechanic a mechanism, not a benefit?
- Is the honest-boundary paragraph there, and does it give something up?
- Is there exactly one link to 0xnull.io?
- Are there zero banned words, zero exclamation marks, zero Oxford commas?
- Does every number have a denominator?
- Does the last line stand on its own?
- Is every claim in the fact block?

## Calibration sample

This opening is the reference register:

> The trades run on cash for good reasons. It's final — nobody can claw it back. It's private — your competitors don't see your rates and your suppliers don't see your margins. It works when the card machine doesn't. And nobody at a bank decides whether you're allowed to be paid this week.
>
> Cash also has problems every tradesman knows. It gets stolen out of vans and site offices. It can't be sent — someone drives it. There's no receipt unless you make one. Banks treat sole traders who deposit it like suspects.

Match that. Short, concrete, no sell.

## Output format

Return JSON only, no fences:

{"title": "...", "slug": "...", "excerpt": "one sentence, under 160 characters, no sell", "body_markdown": "..."}


## Hard length requirement

body_markdown must be between 400 and 700 words. A post under 400 words is rejected automatically and never published. If the fact block is thin, expand the problem section and the honest boundary rather than inventing claims. Count the words before you return.
$seed$
WHERE NOT EXISTS (SELECT 1 FROM public.blog_voice);

INSERT INTO public.blog_settings (publish_mode, run_hour_london, enabled)
SELECT 'draft', 7, true
WHERE NOT EXISTS (SELECT 1 FROM public.blog_settings);

INSERT INTO public.blog_queue (day_index, product_key, title_hint, reader, page_url, "constraint", facts, status)
SELECT 1, $seed$/phone$seed$, $seed$A phone number that isn't yours$seed$, $seed$someone who needs a number for sign-ups, work or a second life that doesn't route back to their name$seed$, $seed$https://0xnull.io/phone$seed$, NULL, $seed$Anonymous phone numbers via nadanada (formerly LNVPN, rebranded April 2026)
No KYC, no account with 0xNull
Paid in crypto [VERIFY: which — XMR, BTC/Lightning, both?]
Use cases: receiving verification SMS, a separate work number, a number that doesn't sit in a carrier's customer record under your name [VERIFY use-case list against the page]
nadanada is an affiliate partner; 0xNull earns a referral$seed$, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_queue WHERE day_index = 1);

INSERT INTO public.blog_queue (day_index, product_key, title_hint, reader, page_url, "constraint", facts, status)
SELECT 2, $seed$Swaps$seed$, $seed$Buying Monero without an exchange account$seed$, $seed$someone who holds BTC/ETH/stables and wants XMR without opening a KYC exchange account$seed$, $seed$https://0xnull.io/swaps$seed$, NULL, $seed$Swaps via Trocador and AnonPay integration
No account, no email, no KYC at 0xNull
XMR purchases are the swap flow that gets used most
Also SimpleSwap as a labelled alternative path — works on certain networks only; only routes that were tested are published
0xNull earns a referral on swaps$seed$, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_queue WHERE day_index = 2);

INSERT INTO public.blog_queue (day_index, product_key, title_hint, reader, page_url, "constraint", facts, status)
SELECT 3, $seed$On-ramp$seed$, $seed$From pounds to Monero with nobody in the middle$seed$, $seed$someone with cash or bank money and no crypto yet$seed$, $seed$https://0xnull.io/[VERIFY on-ramp page slug]$seed$, NULL, $seed$Fiat on-ramp is Hodl Hodl: peer-to-peer BTC with multisig escrow, no KYC
Then the existing swap path from BTC to XMR
Referral-based; 0xNull earns a referral
End to end without an identity check at 0xNull
Hodl Hodl trades are with another person, not a company; escrow holds the BTC until fiat is confirmed [VERIFY wording against Hodl Hodl's own description]$seed$, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_queue WHERE day_index = 3);

INSERT INTO public.blog_queue (day_index, product_key, title_hint, reader, page_url, "constraint", facts, status)
SELECT 4, $seed$/work$seed$, $seed$Jobs that pay in Monero$seed$, $seed$someone who wants to earn in XMR, or a business that wants to pay in it$seed$, $seed$https://0xnull.io/work$seed$, NULL, $seed$Aggregates XMR-paying job listings from monero.jobs, two Monerica feeds and the Telegram MoneroJobs channel
Telegram source ingested every 30 minutes
Read-only: it lists and links out. 0xNull does not host the job, take a cut or escrow payment
Public jobs API with docs
No account needed to browse$seed$, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_queue WHERE day_index = 4);

INSERT INTO public.blog_queue (day_index, product_key, title_hint, reader, page_url, "constraint", facts, status)
SELECT 5, $seed$The 0xn_ token$seed$, $seed$One balance, no account$seed$, $seed$anyone who's used any 0xNull product and wondered what the token is$seed$, $seed$https://0xnull.io/[VERIFY token page slug]$seed$, NULL, $seed$A token is a string: 0xn_ followed by 64 hex characters. That is the whole account. No email, no password, no name
Funded with XMR; balance shown in dollars
One balance is used across products — a bet reserves from it, a win or refund credits it
Withdraw to your own Monero wallet whenever you want; that's when XMR actually moves
Lose the token string and the balance is gone — nobody can recover it. That's the trade
KYCNOT.ME score 88/100$seed$, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_queue WHERE day_index = 5);

INSERT INTO public.blog_queue (day_index, product_key, title_hint, reader, page_url, "constraint", facts, status)
SELECT 6, $seed$Anonymous VPS$seed$, $seed$A server nobody asked your name for$seed$, $seed$someone who needs a box for a project and doesn't want it tied to a card and an address$seed$, $seed$https://0xnull.io/[VERIFY vps page slug]$seed$, NULL, $seed$Anonymous VPS via SporeStack
Paid in crypto [VERIFY: XMR accepted?]
No account, no email at 0xNull
Affiliate partner; 0xNull earns a referral
[VERIFY: specs, regions, pricing — none confirmed; do not state]$seed$, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_queue WHERE day_index = 6);

INSERT INTO public.blog_queue (day_index, product_key, title_hint, reader, page_url, "constraint", facts, status)
SELECT 7, $seed$Anonymous eSIM$seed$, $seed$Data without a contract$seed$, $seed$traveller or someone who wants mobile data not tied to a carrier account in their name$seed$, $seed$https://0xnull.io/[VERIFY esim page slug]$seed$, NULL, $seed$Anonymous eSIM [VERIFY: provider, countries, payment methods — none confirmed]
No KYC at 0xNull
[If the fact block is still this thin on the day, skip Day 7 and move Day 8 up]$seed$, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_queue WHERE day_index = 7);

INSERT INTO public.blog_queue (day_index, product_key, title_hint, reader, page_url, "constraint", facts, status)
SELECT 8, $seed$AI tools$seed$, $seed$Models that don't keep a file on you$seed$, $seed$someone who wants to talk to a model without the conversation becoming a record on an account$seed$, $seed$https://0xnull.io/[VERIFY ai page slug]$seed$, NULL, $seed$Models available: Dolphin 72B (therapy-style), EVA Qwen 72B (companion), voice TTS and cloning
Routed via NanoGPT
Paid from the 0xn_ token balance [VERIFY]
No account, no chat history tied to an identity [VERIFY: what is and isn't retained — state only what is confirmed]
Boundary to include: these are language models, not clinicians. Say that plainly$seed$, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_queue WHERE day_index = 8);

INSERT INTO public.blog_queue (day_index, product_key, title_hint, reader, page_url, "constraint", facts, status)
SELECT 9, $seed$Private lending$seed$, $seed$DeFi without the public ledger showing your position$seed$, $seed$someone who understands DeFi and dislikes that every position is public$seed$, $seed$https://0xnull.io/[VERIFY lending page slug]$seed$, NULL, $seed$Lending routed through Aave V3 with Railgun shielding
Positions are not visible on the public chain the way a normal Aave position is
Launched February 2026
[VERIFY: supported assets, minimums, fees — do not state]
Boundary to include: this is DeFi lending — smart contract risk and rate risk are the user's. Say so without a disclaimer voice$seed$, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_queue WHERE day_index = 9);

INSERT INTO public.blog_queue (day_index, product_key, title_hint, reader, page_url, "constraint", facts, status)
SELECT 10, $seed$Predictions$seed$, $seed$A market seeded with real money and no house edge on the line$seed$, $seed$a bettor outside Great Britain who's tired of accounts, limits and the book closing them$seed$, $seed$https://0xnull.io/predictions$seed$, $seed$NOT AVAILABLE IN GREAT BRITAIN. State it as one flat sentence. Do not explain why. Do not use UK examples (no EFL Cup, no Premier League). Use a non-UK fixture or esports.$seed$, $seed$Parimutuel: bettors share the pool, there is no bookmaker taking the other side
Every eligible market opens with $4 seeded, split by the median no-vig bookmaker probability across aggregated books
Odds move as bets arrive; the displayed multiple is the current pool, not a fixed price
Fee: 0.4% on winnings only. No fee on losses, draws or refunds
Bets reserve from the 0xn_ token balance; wins and refunds credit it automatically when the oracle resolves
XMR moves only when you withdraw
Coverage: 150+ sports leagues, 15+ esports, crypto markets
No account, no email, no KYC
Not available in Great Britain
Boundary to include: $4 of seed is thin. A large bet moves the odds against itself. Say this plainly$seed$, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_queue WHERE day_index = 10);
