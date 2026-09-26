# Panda Express Web App

A restaurant point of sale prototype built with Express, EJS, and PostgreSQL. It includes a customer kiosk, cashier order flow, kitchen and prep views, menu boards, and manager screens for inventory, employees, schedules, recipes, pricing, and reports.

## Run locally

Install Node.js, npm, and PostgreSQL. Before starting the server, configure `db.js`: it currently refers to `DBUSER`, `DBHOST`, `DBNAME`, and `DBPSWD` as JavaScript identifiers without defining them, so startup fails as written. Set those fields from your PostgreSQL connection settings (for example, `process.env.DB_USER`, `process.env.DB_HOST`, `process.env.DB_NAME`, and `process.env.DB_PASSWORD`). The application also expects restaurant tables and data that are not created automatically. SQL files in the related Point of Sales Software project document parts of the data model, but are not an automated migration for this app.

Then, from this directory, run:

```bash
npm ci
npm start
```

The server listens on `http://localhost:3000` by default. Set `PORT` to use another port. Open `/login` to access the application. The sign-in flow currently uses demo users defined in `routes/login.js`.

## Main areas

| URL | Purpose |
| --- | --- |
| `/customer` | Self-service ordering kiosk |
| `/newCashier` | Cashier order entry |
| `/kitchen` and `/prep-table` | Fulfillment views |
| `/menu-board` | Customer-facing menu |
| `/manager` | Operations, inventory, pricing, staffing, and reports |

`server.js` mounts the routes, `routes/` holds request handlers, `views/` contains EJS templates, and `public/` contains styles, images, and browser scripts. The browser scripts for weather and currency exchange use third-party APIs; review their configuration before public deployment.

This is a project prototype. Its demo credentials and authentication secrets are embedded in source, so they must be replaced before production use.
