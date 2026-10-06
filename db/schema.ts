import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const players=sqliteTable('players',{token:text('token').primaryKey(),name:text('name').notNull(),preferences:text('preferences').notNull(),slots:text('slots').notNull(),roomId:text('room_id').notNull().default('main'),preferredDates:text('preferred_dates').notNull().default('[]')});
