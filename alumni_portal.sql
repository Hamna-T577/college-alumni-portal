-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: alumni_portal
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `allowed_emails`
--

DROP TABLE IF EXISTS `allowed_emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `allowed_emails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone_no` varchar(15) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `reg_no` varchar(50) DEFAULT NULL,
  `graduation_year` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allowed_emails`
--

LOCK TABLES `allowed_emails` WRITE;
/*!40000 ALTER TABLE `allowed_emails` DISABLE KEYS */;
INSERT INTO `allowed_emails` VALUES (1,'John Doe','johndoe@example.com','9876543210','Computer Science','CS123',2025),(2,'Arunima K','arunima.k1234@gmail.com','4563217892','Computer Science','CS142',2026),(3,'Arunima','arunima.k19@gmail.com','4527382919','Electrical','EE001',2022),(4,'Sheeja A','sheeja.a1911@gmail.com','9830482730',NULL,'EC024',2027),(6,'Fathima Safa','fathimasafa131@gmail.com','7846280280',NULL,'CS023',2021),(7,'Hiba Khadeeja M C','hibakhadeeja.05@gmail.com','9363748320',NULL,'CS026',2021),(8,'Hamna T','hamnat211@gmail.com','8709892730',NULL,'CS025',2023);
/*!40000 ALTER TABLE `allowed_emails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_applications`
--

DROP TABLE IF EXISTS `job_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_id` int DEFAULT NULL,
  `applicant_id` int DEFAULT NULL,
  `application_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','accepted','rejected') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `job_id` (`job_id`),
  KEY `applicant_id` (`applicant_id`),
  CONSTRAINT `job_applications_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `job_applications_ibfk_2` FOREIGN KEY (`applicant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_applications`
--

LOCK TABLES `job_applications` WRITE;
/*!40000 ALTER TABLE `job_applications` DISABLE KEYS */;
INSERT INTO `job_applications` VALUES (1,4,11,'2025-03-14 14:46:25','pending'),(2,3,11,'2025-03-17 01:41:42','pending');
/*!40000 ALTER TABLE `job_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `company` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `skills_required` text NOT NULL,
  `posted_by` varchar(255) NOT NULL,
  `posted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES (1,'Software Engineer','Exciting opportunity at a leading tech firm.','Google','Remote','Python, Flask, SQL','9','2025-03-13 16:48:03'),(2,'software engineer','need 4 years of experience in the field of ai','tcs','kannur','c, python','9','2025-03-13 16:59:48'),(3,'Software Engineer','Exciting opportunity at a leading tech firm.','Google','Remote','Python, Flask, SQL','9','2025-03-14 09:25:16'),(4,'ewd','adwwa','deawed','dea','wewd','9','2025-03-14 12:29:15');
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('student','alumni','admin') DEFAULT NULL,
  `graduation_year` int DEFAULT NULL,
  `phone_no` varchar(15) DEFAULT NULL,
  `skills` text,
  `resume_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (9,'Arunima','arunima.k19@gmail.com','scrypt:32768:8:1$OV3forg8suIDODJo$c73fb1aae2a853ea573816077e0a87df597b707765291e275d630d4d7da6fb5394d21c3d935dc69a544fead123b87a70ad3b9f049c9873e47406530b7e5d4fd4','alumni',NULL,NULL,NULL,NULL),(11,'Sheeja A','sheeja.a1911@gmail.com','scrypt:32768:8:1$C4UklR54Jg0vqHfS$cf5721fb42d6d87c886a28591499c87319f596dcea1e22b8cac88f25b9cb0432a23b87a13794863297bb9015c6b536b259a0e40807cc1a773a365e33d70940dc','student',NULL,NULL,'java, machine learning, linux, mac os, plc programming, data science, 3ds max, computer networks, matlab, html, dreamweaver, artificial intelligence, microsoft office, computer vision, c++, mysql, adobe photoshop','static/resumes\\user_11.pdf'),(13,'Admin coet','arunima.k1234@gmail.com','scrypt:32768:8:1$nUX7HxvX6R3IrWBA$97c1d5e7b11717ccad9f5f76b922b824be2b799109af1532202a7377ca38e3d85a27d1130b14d808f4a84f0469df427edded8ac2cde73b995c838f1874fbdd70','admin',NULL,'9374827480',NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-18 19:34:06
