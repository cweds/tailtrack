import { pgTable, foreignKey, unique, serial, text, timestamp, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
        id: serial().primaryKey().notNull(),
        email: text().notNull(),
        username: text().notNull(),
        passwordHash: text("password_hash").notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        householdId: integer("household_id"),
}, (table) => [
        foreignKey({
                        columns: [table.householdId],
                        foreignColumns: [households.id],
                        name: "users_household_id_fkey"
                }),
        unique("users_email_unique").on(table.email),
        unique("users_username_unique").on(table.username),
]);

export const activities = pgTable("activities", {
        id: serial().primaryKey().notNull(),
        userId: integer("user_id").notNull(),
        action: text().notNull(),
        timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
        householdId: integer("household_id"),
        petIds: integer("pet_ids").array().default([]).notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.householdId],
                        foreignColumns: [households.id],
                        name: "activities_household_id_fkey"
                }),
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "activities_user_id_users_id_fk"
                }),
]);

export const households = pgTable("households", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        inviteCode: text("invite_code").notNull(),
        creatorId: integer("creator_id"),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        unique("households_invite_code_key").on(table.inviteCode),
        foreignKey({
                columns: [table.creatorId],
                foreignColumns: [users.id],
                name: "households_creator_id_users_id_fk"
        }),
]);

export const pets = pgTable("pets", {
        id: serial().primaryKey().notNull(),
        householdId: integer("household_id").notNull(),
        name: text().notNull(),
        petType: text("pet_type").notNull(),
        photoUrl: text("photo_url"),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.householdId],
                        foreignColumns: [households.id],
                        name: "pets_household_id_fkey"
                }),
]);
