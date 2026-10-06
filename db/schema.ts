import {sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const players=sqliteTable('players',{token:text('token').primaryKey(),name:text('name').notNull(),preferences:text('preferences').notNull(),slots:text('slots').notNull()});
