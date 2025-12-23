# QR Code Generator App

A simple React (Next.js) based QR Code generator that allows you to generate and print two QR codes based on an index and user role. Passwords are generated once per role and reused consistently.

## ✨ Features

- Generate two QR codes with:
  - Custom name
  - Address
  - Role-based password (static per role)
- Role-based user types: `USER`, `MAINTENANCE`, `PRODUCTION`, `SUPERUSER`
- Index-based deterministic name and address generation
- Prevents invalid input (non-numeric or zero)
- Print-friendly layout
- Skeleton loading before QR is generated

## 📸 Preview

| Before Generate             | After Generate              |
|----------------------------|-----------------------------|
| ![skeleton](./public/skeleton-preview.png) | ![generated](./public/generated-preview.png) |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm / npm / yarn

### Installation

```bash
pnpm install
# or
npm install
# or
yarn
