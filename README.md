# logan-backend

The backend API for Logan. This is an unfinished project and hasn't been legitimately updated since early 2020.

This is intended to demonstrate an understanding of backend development using Express and Node.js. Minimal testing is present, due to this being mainly a personal exercise.

## Setup

The server runs on an AWS EC2 instance, and uses DynamoDB and AWS Secrets Manager for data storage.

## Source structure

The entry point for the server is `server.js`

All routing is handled by `router.js`

Requests are authed by `utils/auth.js` and validated by `utils/validation.js`

Handlers for the actual endpoints are located in the `controllers` folder
