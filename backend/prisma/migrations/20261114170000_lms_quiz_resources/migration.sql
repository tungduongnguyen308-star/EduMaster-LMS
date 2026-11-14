-- Add assessment and resource tables without changing existing LMS records.
CREATE TABLE `Quiz` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `lessonId` INTEGER NOT NULL,
  `timeLimit` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Quiz_lessonId_key`(`lessonId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `QuizQuestion` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `quizId` INTEGER NOT NULL,
  `text` TEXT NOT NULL,
  `position` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `QuizOption` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `questionId` INTEGER NOT NULL,
  `text` VARCHAR(191) NOT NULL,
  `isCorrect` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `QuizAttempt` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `quizId` INTEGER NOT NULL,
  `studentId` INTEGER NOT NULL,
  `score` INTEGER NOT NULL,
  `total` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `QuizAttempt_quizId_studentId_idx`(`quizId`, `studentId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `QuizAnswer` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `attemptId` INTEGER NOT NULL,
  `questionId` INTEGER NOT NULL,
  `optionId` INTEGER NOT NULL,
  `isCorrect` BOOLEAN NOT NULL,
  UNIQUE INDEX `QuizAnswer_attemptId_questionId_key`(`attemptId`, `questionId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `LessonResource` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `lessonId` INTEGER NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `url` TEXT NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Quiz` ADD CONSTRAINT `Quiz_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizQuestion` ADD CONSTRAINT `QuizQuestion_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizOption` ADD CONSTRAINT `QuizOption_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `QuizQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_quizId_fkey` FOREIGN KEY (`quizId`) REFERENCES `Quiz`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizAnswer` ADD CONSTRAINT `QuizAnswer_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `QuizAttempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizAnswer` ADD CONSTRAINT `QuizAnswer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `QuizQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizAnswer` ADD CONSTRAINT `QuizAnswer_optionId_fkey` FOREIGN KEY (`optionId`) REFERENCES `QuizOption`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LessonResource` ADD CONSTRAINT `LessonResource_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `Lesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
