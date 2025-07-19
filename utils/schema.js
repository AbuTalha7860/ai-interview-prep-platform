import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const MockInterview = pgTable('mockInterview',{
    id:serial('id').primaryKey(),
    jsonMokedResp:text('jsonMokedResp').notNull(),
    jobPosition:varchar('jobPosition').notNull(),
    jobDesc:varchar('jobDesc').notNull(),
    jobExperience:varchar('jobExperience').notNull(),
    createdBy:varchar('createdBy').notNull(),
    createdAt:varchar('createdAt').notNull(),
    mockId:varchar('mockId').notNull()
})

export const UserAnswer = pgTable('userAnswer',{
    id:serial('id').primaryKey(),
    mockIdRef:varchar('mockId').notNull(),
    question:varchar('question').notNull(),
    correctAns:text('correctAns').notNull(),
    userAns:text('userAns').notNull(),
    feedback:text('feedback').notNull(),
    rating:varchar('rating').notNull(),
    userEmail:varchar('userEmail').notNull(),
    createdAt:varchar('createdAt').notNull()
})

export const Questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  answer: text("answer"),
  role: varchar("role").notNull(),
  createdAt: varchar("createdAt").notNull(),
});

