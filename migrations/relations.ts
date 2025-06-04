import { relations } from "drizzle-orm/relations";
import { households, users, activities, pets } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	household: one(households, {
		fields: [users.householdId],
		references: [households.id]
	}),
	activities: many(activities),
}));

export const householdsRelations = relations(households, ({many}) => ({
	users: many(users),
	activities: many(activities),
	pets: many(pets),
}));

export const activitiesRelations = relations(activities, ({one}) => ({
	household: one(households, {
		fields: [activities.householdId],
		references: [households.id]
	}),
	user: one(users, {
		fields: [activities.userId],
		references: [users.id]
	}),
}));

export const petsRelations = relations(pets, ({one}) => ({
	household: one(households, {
		fields: [pets.householdId],
		references: [households.id]
	}),
}));