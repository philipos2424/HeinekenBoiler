-- CreateEnum
CREATE TYPE "RsvpResponse" AS ENUM ('ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "Attendee" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "dietary" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "response" "RsvpResponse",
    "checkedInAt" TIMESTAMP(3),
    "checkedInByStaffId" TEXT,
    "confirmationEmailSentAt" TIMESTAMP(3),
    "confirmationEmailError" TEXT,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordSalt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attendee_phone_key" ON "Attendee"("phone");

-- CreateIndex
CREATE INDEX "Attendee_response_idx" ON "Attendee"("response");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_username_key" ON "StaffUser"("username");

-- AddForeignKey
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_checkedInByStaffId_fkey" FOREIGN KEY ("checkedInByStaffId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
