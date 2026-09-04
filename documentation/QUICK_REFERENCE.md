## The 3 Parts of Your App

Think of a restaurant:

- **Angular (Frontend)** = the dining area — what the customer sees and interacts with
- **Express (Backend)** = the kitchen — takes the order, decides how to make it, does the real work
- **MySQL (Database)** = the pantry/fridge — where all the ingredients (data) are stored

The customer never walks into the kitchen or the pantry themselves. They give their order to a waiter (that's the HTTP request), the kitchen does the work, and food comes back out.

---

## How a Click Becomes a Database Change

Say you click "Add to Cart":

1. **You click the button** → Angular notices.
2. **Angular sends a note to Express** saying "user wants to add product #5, quantity 2."
3. **Express double-checks a few things:**
   - Is this request actually coming from our app? (not some random site)
   - Is the user logged in?
   - Does the product exist and is there enough stock?
4. **Express tells MySQL** to either update the cart (if item's already there) or add a new row (if it's new).
5. **MySQL confirms** it saved the change.
6. **Express sends back a "success" message.**
7. **Angular updates the screen** — cart number goes up, you see a confirmation.

That whole thing happens in under a second.

---

## Why Not Just Let Angular Talk to MySQL Directly?

Two reasons:

1. **Security** — if the frontend could talk straight to the database, anyone could open their browser tools and steal passwords or mess with data.
2. **Rules/logic** — someone needs to check things like "is there enough stock?" before saving. That's the backend's job.

So the backend acts as a gatekeeper in the middle.

---

## Login, Simplified

1. You type your email/password → sent to the backend.
2. Backend checks it against what's stored (passwords are scrambled/hashed, never stored plainly).
3. If correct, backend hands you two "passes":
   - A short-lived one (15 minutes) for normal use
   - A longer one (7 days) to quietly refresh you without logging in again
4. Every time you do something afterward, your browser shows that pass to prove it's really you.

---

## The Whole Thing in One Line

**You click → Angular asks → Express checks and decides → MySQL stores/fetches → Express replies → Angular shows you the result.**

That's the entire architecture. Everything else (connection pools, tokens, CORS) is just extra safety and speed measures layered on top of this basic flow.