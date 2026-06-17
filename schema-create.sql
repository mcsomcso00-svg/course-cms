-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TUTOR');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('PLANNED', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('INCOMPLETE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'DISABLED');

-- CreateEnum
CREATE TYPE "PrepStatus" AS ENUM ('NONE', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "TutorPrepStatus" AS ENUM ('NOT_SENT', 'SENT', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "MaterialPrepStatus" AS ENUM ('NO_CONTENT', 'NO_MATERIAL', 'NOT_SENT_SCHOOL', 'DONE');

-- CreateEnum
CREATE TYPE "ConfirmationStatus" AS ENUM ('PENDING', 'SIGNED', 'CONFIRMED', 'VOID');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('NOT_PREPARED', 'IN_PROGRESS', 'PREPARED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TUTOR',
    "perLessonRate" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tutorNo" TEXT,
    "region" TEXT,
    "subjects" TEXT,
    "scrcExpiry" DATE,
    "dseResult" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "remarks" TEXT,
    "gender" TEXT,
    "dob" DATE,
    "hkid" TEXT,
    "address" TEXT,
    "payeeName" TEXT,
    "bankCode" TEXT,
    "bankAccount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "checkInRadius" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'PLANNED',
    "feeNote" TEXT,
    "invoiceStatus" "InvoiceStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "tutorYearsRequired" TEXT,
    "tutorQualification" TEXT,
    "tutorOtherRequirements" TEXT,
    "contentRequirement" TEXT,
    "materialRequirement" TEXT,
    "teachingLanguage" TEXT,
    "notes" TEXT,
    "workPlanNote" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "studentGrades" TEXT[],
    "studentCount" INTEGER,
    "classLocation" TEXT,
    "materialLocation" TEXT,
    "daysOfWeek" INTEGER[],
    "startTime" TEXT,
    "endTime" TEXT,
    "budget" TEXT,
    "requiresTA" BOOLEAN NOT NULL DEFAULT false,
    "requiresAssistant" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED',
    "coursePrepStatus" "PrepStatus" NOT NULL DEFAULT 'NONE',
    "materialStatus" "MaterialPrepStatus" NOT NULL DEFAULT 'NO_CONTENT',
    "tutorPrepStatus" "TutorPrepStatus" NOT NULL DEFAULT 'NOT_SENT',
    "tutorId" TEXT,
    "substituteTutorId" TEXT,
    "tutorFee" DECIMAL(10,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMP(3),
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "payPercent" INTEGER NOT NULL,
    "payAmount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobConfirmation" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "courseId" TEXT,
    "title" TEXT NOT NULL,
    "position" TEXT,
    "status" "ConfirmationStatus" NOT NULL DEFAULT 'PENDING',
    "tutorFee" DECIMAL(10,2),
    "otherAgreement" TEXT,
    "signatureData" TEXT,
    "agreed" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialItem" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER,
    "status" "MaterialStatus" NOT NULL DEFAULT 'NOT_PREPARED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_JobConfirmationToLesson" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JobConfirmationToLesson_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_label_key" ON "AcademicYear"("label");

-- CreateIndex
CREATE INDEX "VerificationCode_phone_idx" ON "VerificationCode"("phone");

-- CreateIndex
CREATE INDEX "Course_academicYearId_schoolId_idx" ON "Course"("academicYearId", "schoolId");

-- CreateIndex
CREATE INDEX "Group_courseId_idx" ON "Group"("courseId");

-- CreateIndex
CREATE INDEX "Lesson_groupId_date_idx" ON "Lesson"("groupId", "date");

-- CreateIndex
CREATE INDEX "Lesson_tutorId_date_idx" ON "Lesson"("tutorId", "date");

-- CreateIndex
CREATE INDEX "CheckIn_tutorId_checkInAt_idx" ON "CheckIn"("tutorId", "checkInAt");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_lessonId_tutorId_key" ON "CheckIn"("lessonId", "tutorId");

-- CreateIndex
CREATE INDEX "JobConfirmation_tutorId_status_idx" ON "JobConfirmation"("tutorId", "status");

-- CreateIndex
CREATE INDEX "MaterialItem_courseId_status_idx" ON "MaterialItem"("courseId", "status");

-- CreateIndex
CREATE INDEX "_JobConfirmationToLesson_B_index" ON "_JobConfirmationToLesson"("B");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_substituteTutorId_fkey" FOREIGN KEY ("substituteTutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobConfirmation" ADD CONSTRAINT "JobConfirmation_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobConfirmation" ADD CONSTRAINT "JobConfirmation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialItem" ADD CONSTRAINT "MaterialItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobConfirmationToLesson" ADD CONSTRAINT "_JobConfirmationToLesson_A_fkey" FOREIGN KEY ("A") REFERENCES "JobConfirmation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobConfirmationToLesson" ADD CONSTRAINT "_JobConfirmationToLesson_B_fkey" FOREIGN KEY ("B") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

