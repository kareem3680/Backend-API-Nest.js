# Backend-API Documentation

## Overview

This API is designed for the **Backend API Technology Platform**.
It is built using a **Multi-Tenant Architecture**, where each company operates in a completely isolated environment with its own data and users.

Built with **NestJS** + **TypeScript** and backed by **PostgreSQL**.

> This document only covers the modules currently implemented and present in the Postman collection: **Identity**, **Forget Password**, **Super-Admin Dashboard**, **Admin Dashboard**, and **Notifications**.

---

# Roles

The system currently has two roles:

| Role          | Scope   | Description                                            |
| ------------- | ------- | ------------------------------------------------------ |
| `super-admin` | Global  | Manages the whole platform and all companies (tenants) |
| `admin`       | Company | Manages users within their own company                 |

---

# Multi-Tenant Isolation

- The **Super Admin** is the only role allowed to create companies (Tenants).
- When a company is created, all users are automatically linked to that company.
- The `companyId` is automatically injected via the JWT token, so the client does not need to send it manually (except for `super-admin`).
- Each `admin` can only manage users within their own company.
- Activation and deactivation operations are available for both companies and users.
- The `super-admin` role does not require `companyId` in its JWT token.

---

# Common Features

Endpoints that return lists support the following query features:

| Feature         | Description                  | Example                             |
| --------------- | ---------------------------- | ----------------------------------- |
| Pagination      | Split results into pages     | `?page=1&limit=10`                  |
| Sorting         | Sort results by a field      | `?sort=-createdAt` or `?sort=jobId` |
| Field Selection | Return only specific fields  | `?fields=name,phone`                |
| Filtering       | Filter by exact match        | `?active=true`                      |
| Range Filtering | Filter by numeric ranges     | `?jobId[gte]=120&jobId[lte]=200`    |
| Date Range      | Filter by date interval      | `?from=2025-01-01&to=2025-12-31`    |
| Search          | Text search in string fields | `?keyword=john`                     |

---

# Identity Module

| Endpoint                  | Method | Description                              |
| ------------------------- | ------ | ---------------------------------------- |
| `/api/v1/auth/refresh`    | POST   | Refresh access token using refresh token |
| `/api/v1/auth/sign-up`    | POST   | Register a new user                      |
| `/api/v1/auth/log-in`     | POST   | Login (email + password)                 |
| `/api/v1/auth/log-out`    | POST   | Logout                                   |
| `/api/v1/profile/me`      | GET    | Get current user data                    |
| `/api/v1/profile/me`      | PATCH  | Update current user data                 |
| `/api/v1/update-password` | PATCH  | Change current user's password           |

## Sign-Up Request Example

```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "profileImage": "",
  "phone": "+11234567890",
  "password": "Password000",
  "passwordConfirmation": "Password000",
  "position": "Director"
}
```

## Log-In Request Example

```json
{
  "email": "admin@example.com",
  "password": "password000"
}
```

---

# Forget Password Module (OTP)

| Endpoint                                    | Method | Description                       |
| ------------------------------------------- | ------ | --------------------------------- |
| `/api/v1/forget-password/send-reset-code`   | POST   | Send reset code to email          |
| `/api/v1/forget-password/resend-reset-code` | POST   | Resend reset code                 |
| `/api/v1/forget-password/verify-reset-code` | POST   | Verify reset code                 |
| `/api/v1/forget-password/reset-password`    | PUT    | Reset password after verification |

---

# Super-Admin Dashboard (Tenant Management)

Only accessible by `super-admin`.

| Endpoint                                   | Method | Description                                            |
| ------------------------------------------ | ------ | ------------------------------------------------------ |
| `/api/v1/companies`                        | POST   | Create a new company (Tenant)                          |
| `/api/v1/companies`                        | GET    | Get all companies                                      |
| `/api/v1/companies/{companyId}`            | GET    | Get single company details                             |
| `/api/v1/companies/{companyId}`            | PATCH  | Update company                                         |
| `/api/v1/companies/{companyId}`            | DELETE | Delete company (hard delete, with all associated data) |
| `/api/v1/companies/deactivate/{companyId}` | PATCH  | Deactivate company                                     |
| `/api/v1/companies/activate/{companyId}`   | PATCH  | Activate company                                       |
| `/api/v1/companies/{companyId}/users`      | GET    | Get all users for a specific company                   |
| `/api/v1/adminDashboard`                   | POST   | Create the first `admin` user inside a company         |

## Create Company Request Example

```json
{
  "name": "Company Legal Name",
  "nameAr": "",
  "nameEn": "Company Legal Name (EN)",
  "email": "info@company.com",
  "phone": "+11234567890",
  "whatsapp": "+11234567890",
  "commercialRegisterNumber": "1010234567",
  "country": "Country Name",
  "politicalManager": "Manager Full Name",
  "activityType": "Marketing",
  "legalData": "License number 98765, issued by the Ministry of Commerce",
  "taxNumber": "123456789",
  "legalEntityName": "Legal Entity Name",
  "city": "City Name",
  "legalState": "Active"
}
```

## Create Admin Inside Company Request Example

```json
{
  "name": "Company Admin",
  "email": "admin@company.com",
  "profileImage": "",
  "phone": "+11234567890",
  "password": "Password000",
  "passwordConfirmation": "Password000",
  "position": "Admin",
  "role": "admin",
  "companyId": "c224f2a4-2828-496d-866a-1acb9dc1f4e9"
}
```

---

# Admin Dashboard (Company Level)

Accessible by `admin` (scoped to their own company) and `super-admin`.

| Endpoint                                      | Method | Description                          |
| --------------------------------------------- | ------ | ------------------------------------ |
| `/api/v1/adminDashboard`                      | POST   | Create a new user inside the company |
| `/api/v1/adminDashboard`                      | GET    | Get all users                        |
| `/api/v1/adminDashboard/{userId}`             | GET    | Get specific user                    |
| `/api/v1/admin-dashboard/{userId}`            | PATCH  | Update user role                     |
| `/api/v1/admin-dashboard/deactivate/{userId}` | PATCH  | Deactivate user                      |
| `/api/v1/admin-dashboard/activate/{userId}`   | PATCH  | Activate user                        |

> Note: some endpoints currently use `adminDashboard` and others use `admin-dashboard` — this naming inconsistency exists in the current implementation and should be unified.

## Create User Request Example

```json
{
  "name": "",
  "email": "",
  "phone": "",
  "password": "",
  "passwordConfirmation": "",
  "position": "",
  "role": ""
}
```

---

# Notifications Module

| Endpoint                                      | Method | Description                                      |
| --------------------------------------------- | ------ | ------------------------------------------------ |
| `/api/v1/notifications`                       | POST   | Create notification in database only             |
| `/api/v1/notifications/send`                  | POST   | Create and send notification (Socket + FCM Push) |
| `/api/v1/notifications`                       | GET    | Get all notifications with read/unread stats     |
| `/api/v1/notifications/unread/count`          | GET    | Get unread notifications count                   |
| `/api/v1/notifications/mark-all`              | PATCH  | Mark all notifications as read                   |
| `/api/v1/notifications/mark/{notificationId}` | PATCH  | Mark specific notification as read               |

## Notification Delivery Methods

| Method        | Description                                 |
| ------------- | ------------------------------------------- |
| **Socket.io** | Real-time notifications for connected users |
| **FCM**       | Push notifications for mobile devices       |

## Create Notification Request Example

```json
{
  "title": "Test Notification",
  "message": "Hello",
  "module": "system",
  "importance": "low",
  "toRole": ["admin"]
}
```

## Send Notification Request Example

```json
{
  "title": "Test Notification",
  "message": "Hello",
  "module": "system",
  "importance": "low",
  "toUser": ["c224f2a4-2828-496d-866a-1acb9dc1f4e9"]
}
```

---

# Role-Based Access Control (RBAC)

| Role          | Companies   | Users (Admin Dashboard)     | Notifications | Scope   |
| ------------- | ----------- | --------------------------- | ------------- | ------- |
| `super-admin` | Full Access | Full Access (all companies) | Full Access   | Global  |
| `admin`       | No Access   | Full Access (own company)   | Full Access   | Company |

---

# Notes

- JWT is used for authentication and automatically injects company context.
- The client never sends `companyId` manually (except for `super-admin`, which must send it when creating company-specific resources).
- Only `super-admin` can create, activate, deactivate, or hard-delete companies.
- `admin` accounts manage users only within their own company.
- Notifications are delivered via both Socket.io (real-time) and FCM (push notifications).
