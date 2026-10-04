CREATE DATABASE  IF NOT EXISTS `medical_app` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `medical_app`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: medical_app
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `cart_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `pharmacy_id` int NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`cart_id`),
  KEY `FK_f091e86a234693a49084b4c2c86` (`user_id`),
  KEY `FK_8dc460ed1a7ccc82fc32b1fe32a` (`pharmacy_id`),
  CONSTRAINT `FK_8dc460ed1a7ccc82fc32b1fe32a` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacy` (`pharmacy_id`),
  CONSTRAINT `FK_f091e86a234693a49084b4c2c86` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_item`
--

DROP TABLE IF EXISTS `cart_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_item` (
  `cart_item_id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL,
  `pharmacy_product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`cart_item_id`),
  KEY `FK_b6b2a4f1f533d89d218e70db941` (`cart_id`),
  KEY `FK_1fdb159e0657dedd098a1360b7a` (`pharmacy_product_id`),
  CONSTRAINT `FK_1fdb159e0657dedd098a1360b7a` FOREIGN KEY (`pharmacy_product_id`) REFERENCES `pharmacy_product` (`pharmacy_product_id`),
  CONSTRAINT `FK_b6b2a4f1f533d89d218e70db941` FOREIGN KEY (`cart_id`) REFERENCES `cart` (`cart_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_item`
--

LOCK TABLES `cart_item` WRITE;
/*!40000 ALTER TABLE `cart_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_info`
--

DROP TABLE IF EXISTS `model_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `model_info` (
  `model_id` int NOT NULL AUTO_INCREMENT,
  `model_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accuracy` decimal(5,2) DEFAULT NULL,
  `model_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `action_date` datetime DEFAULT NULL,
  `admin_id` int NOT NULL,
  PRIMARY KEY (`model_id`),
  KEY `FK_cd10a7a04a6a12a7a2e40c8181e` (`admin_id`),
  CONSTRAINT `FK_cd10a7a04a6a12a7a2e40c8181e` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_info`
--

LOCK TABLES `model_info` WRITE;
/*!40000 ALTER TABLE `model_info` DISABLE KEYS */;
INSERT INTO `model_info` VALUES (3,'wound_prediction_model','v1777200529576',0.75,'C:\\Users\\USER\\Desktop\\MedicalApp\\backend\\Ai\\Prediction\\model\\wound_prediction_model.h5','2026-04-26 17:48:49.583146','2026-04-26 17:48:50',4);
/*!40000 ALTER TABLE `model_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_item`
--

DROP TABLE IF EXISTS `order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `pharmacy_product_id` int NOT NULL,
  `product_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`order_item_id`),
  KEY `FK_e9674a6053adbaa1057848cddfa` (`order_id`),
  KEY `FK_5c188532800e76f485b73c0b815` (`pharmacy_product_id`),
  CONSTRAINT `FK_5c188532800e76f485b73c0b815` FOREIGN KEY (`pharmacy_product_id`) REFERENCES `pharmacy_product` (`pharmacy_product_id`),
  CONSTRAINT `FK_e9674a6053adbaa1057848cddfa` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_item`
--

LOCK TABLES `order_item` WRITE;
/*!40000 ALTER TABLE `order_item` DISABLE KEYS */;
INSERT INTO `order_item` VALUES (8,8,2,'เบตาดีน',59.00,1,59.00,'2026-09-04 01:19:49.460245'),(10,10,2,'เบตาดีน',59.00,1,59.00,'2026-09-04 01:39:35.060452'),(14,12,1,'น้ำเกลือล้างแผล',20.00,1,20.00,'2026-09-21 01:58:26.273975'),(15,13,1,'น้ำเกลือล้างแผล',20.00,1,20.00,'2026-09-21 02:08:58.110885'),(16,13,2,'เบตาดีน',59.00,1,59.00,'2026-09-21 02:08:58.116754'),(17,13,3,'แอลกอฮอล์ 70%',50.00,1,50.00,'2026-09-21 02:08:58.120847');
/*!40000 ALTER TABLE `order_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `pharmacy_id` int NOT NULL,
  `receiver_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `receiver_phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `shipping_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(10,2) NOT NULL,
  `payment_method` enum('COD','PROMPTPAY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COD',
  `payment_status` enum('UNPAID','PENDING_VERIFY','PAID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID',
  `order_status` enum('PENDING','PREPARING','SHIPPING','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `payment_slip` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ocr_amount` decimal(10,2) DEFAULT NULL,
  `ocr_datetime` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ocr_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ocr_match` tinyint NOT NULL DEFAULT '0',
  `verified_at` datetime DEFAULT NULL,
  `verified_by` int DEFAULT NULL,
  `reject_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`order_id`),
  KEY `FK_a922b820eeef29ac1c6800e826a` (`user_id`),
  KEY `FK_3b733983be3328619e5bf742e6b` (`pharmacy_id`),
  KEY `FK_1c1ccaa9636ccf20642eb602c5a` (`verified_by`),
  CONSTRAINT `FK_1c1ccaa9636ccf20642eb602c5a` FOREIGN KEY (`verified_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FK_3b733983be3328619e5bf742e6b` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacy` (`pharmacy_id`),
  CONSTRAINT `FK_a922b820eeef29ac1c6800e826a` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (8,4,1,'leo','0325478548','กรุงเทพ',59.00,0.00,59.00,'PROMPTPAY','PAID','SHIPPING',NULL,'2026-09-04 01:19:49.456685','2026-09-21 02:49:24.000000','1788460070471.jpg',59.00,NULL,'01601303594080R01012',1,'2026-09-21 02:19:53',5,NULL),(10,4,1,'leo','0254785547','กรุ่งเทพ',59.00,0.00,59.00,'PROMPTPAY','PENDING_VERIFY','CANCELLED',NULL,'2026-09-04 01:39:35.056747','2026-09-21 02:40:15.000000',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL),(12,4,1,'leo','0956525487','กรุงเทพ',20.00,0.00,20.00,'COD','UNPAID','SHIPPING',NULL,'2026-09-21 01:58:26.267630','2026-09-21 02:06:12.000000',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL),(13,4,1,'leo','0956584587','กรุงเทพ',129.00,0.00,129.00,'COD','UNPAID','CANCELLED',NULL,'2026-09-21 02:08:58.107793','2026-09-21 02:25:54.000000',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_otp`
--

DROP TABLE IF EXISTS `password_reset_otp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_otp` (
  `otp_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `otp_code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`otp_id`),
  KEY `IDX_user_id` (`user_id`),
  CONSTRAINT `FK_a2539452d84b302f6badfb75b72` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_otp`
--

LOCK TABLES `password_reset_otp` WRITE;
/*!40000 ALTER TABLE `password_reset_otp` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_otp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pharmacy`
--

DROP TABLE IF EXISTS `pharmacy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pharmacy` (
  `pharmacy_id` int NOT NULL AUTO_INCREMENT,
  `pharmacy_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `longitude` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `license` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'notverify',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `user_id` int NOT NULL,
  `promptpay_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`pharmacy_id`),
  KEY `FK_672832178b734bba48fe9438ed1` (`user_id`),
  CONSTRAINT `FK_672832178b734bba48fe9438ed1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pharmacy`
--

LOCK TABLES `pharmacy` WRITE;
/*!40000 ALTER TABLE `pharmacy` DISABLE KEYS */;
INSERT INTO `pharmacy` VALUES (1,'ShopA',NULL,NULL,'0812345678','ShopA@gmail.com','license-1782039516223-799157755-yuhyr2y2luua1.gif','verify','2026-06-21 17:58:36.233341',5,'0970064405'),(7,'ShopB','13.776156','100.567208','0548745745','ShopB@gmail.com','license-1790589914917-223400993-yuhyr2y2luua1.gif','notverify','2026-09-28 17:05:14.931599',4,NULL);
/*!40000 ALTER TABLE `pharmacy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pharmacy_product`
--

DROP TABLE IF EXISTS `pharmacy_product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pharmacy_product` (
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `stock` int NOT NULL DEFAULT '0',
  `pharmacy_id` int NOT NULL,
  `product_id` int NOT NULL,
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `pharmacy_product_id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`pharmacy_product_id`),
  KEY `FK_412457bda1f2110a775bb6e8ce3` (`pharmacy_id`),
  KEY `FK_fee2ba91be071f5a1a77dd19958` (`product_id`),
  CONSTRAINT `FK_412457bda1f2110a775bb6e8ce3` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacy` (`pharmacy_id`),
  CONSTRAINT `FK_fee2ba91be071f5a1a77dd19958` FOREIGN KEY (`product_id`) REFERENCES `product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pharmacy_product`
--

LOCK TABLES `pharmacy_product` WRITE;
/*!40000 ALTER TABLE `pharmacy_product` DISABLE KEYS */;
INSERT INTO `pharmacy_product` VALUES (5.00,15,1,22,'2026-10-03 17:14:39.000000',1),(5.00,50,1,23,'2026-10-03 17:14:53.000000',2),(5.00,17,1,24,'2026-10-03 17:15:00.000000',3),(0.00,0,1,25,'2026-07-19 20:08:27.672196',4),(0.00,0,1,26,'2026-07-19 20:08:27.678010',5),(0.00,0,1,27,'2026-07-19 20:08:27.683624',6),(0.00,0,1,28,'2026-07-19 20:08:27.691417',7),(0.00,0,1,29,'2026-07-19 20:08:27.698087',8),(0.00,0,1,30,'2026-07-19 20:08:27.705767',9),(0.00,0,1,31,'2026-07-19 20:08:27.712156',10),(0.00,0,1,32,'2026-07-19 20:08:27.716279',11),(0.00,0,1,33,'2026-07-19 20:08:27.719947',12),(0.00,0,1,34,'2026-07-19 20:08:27.724353',13),(0.00,0,1,35,'2026-07-19 20:08:27.730256',14),(0.00,0,1,36,'2026-07-19 20:08:27.734840',15),(0.00,0,1,37,'2026-07-19 20:08:27.739438',16),(0.00,0,1,38,'2026-07-19 20:08:27.744146',17),(0.00,0,1,39,'2026-07-19 20:08:27.748725',18),(0.00,0,1,40,'2026-07-19 20:08:27.753406',19),(0.00,0,1,41,'2026-07-19 20:08:27.759237',20),(0.00,0,1,42,'2026-07-19 20:08:27.764836',21),(10.00,5,1,43,'2026-10-03 19:29:44.435278',22);
/*!40000 ALTER TABLE `pharmacy_product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prediction`
--

DROP TABLE IF EXISTS `prediction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prediction` (
  `prediction_id` int NOT NULL AUTO_INCREMENT,
  `confidence` decimal(5,2) NOT NULL DEFAULT '0.00',
  `predict_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wound_size` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `length` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depth` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_id` int NOT NULL,
  `model_id` int NOT NULL,
  `predict_date` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`prediction_id`),
  KEY `FK_62c055204cdc3285b6c936246a2` (`image_id`),
  KEY `FK_98dfcbeb0c5e6e1bba966587fc7` (`model_id`),
  CONSTRAINT `FK_62c055204cdc3285b6c936246a2` FOREIGN KEY (`image_id`) REFERENCES `wound_image` (`image_id`),
  CONSTRAINT `FK_98dfcbeb0c5e6e1bba966587fc7` FOREIGN KEY (`model_id`) REFERENCES `model_info` (`model_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prediction`
--

LOCK TABLES `prediction` WRITE;
/*!40000 ALTER TABLE `prediction` DISABLE KEYS */;
INSERT INTO `prediction` VALUES (12,100.00,'แผลถลอก','ใหญ่',NULL,NULL,6,3,'2026-08-19 22:40:40.933281'),(13,92.60,'แผลฟกช้ำ','ใหญ่',NULL,NULL,7,3,'2026-08-19 23:18:32.509356'),(33,95.42,'ไม่มีบาดแผล',NULL,NULL,NULL,27,3,'2026-09-26 05:21:34.725191'),(34,96.45,'ไม่มีบาดแผล',NULL,NULL,NULL,28,3,'2026-09-28 16:13:42.824821'),(35,97.27,'แผลถลอก','ใหญ่',NULL,NULL,29,3,'2026-09-28 16:33:07.601945'),(36,95.34,'แผลถลอก','เล็ก',NULL,NULL,30,3,'2026-09-28 16:37:55.403680');
/*!40000 ALTER TABLE `prediction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `product_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `typepro_id` int NOT NULL,
  `image` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_pharmacy_id` int DEFAULT NULL,
  PRIMARY KEY (`product_id`),
  KEY `FK_cea7a6ad26090fd4bc00a4b6e0b` (`typepro_id`),
  KEY `FK_5865a4266e7bbafd7cb642d23cd` (`created_by_pharmacy_id`),
  CONSTRAINT `FK_5865a4266e7bbafd7cb642d23cd` FOREIGN KEY (`created_by_pharmacy_id`) REFERENCES `pharmacy` (`pharmacy_id`) ON DELETE SET NULL,
  CONSTRAINT `FK_cea7a6ad26090fd4bc00a4b6e0b` FOREIGN KEY (`typepro_id`) REFERENCES `type_pro` (`typepro_id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (22,'น้ำเกลือล้างแผล','',2,'น้ำเกลือล้างแผล.png',NULL),(23,'เบตาดีน','',1,'เบตาดีน.jpg',NULL),(24,'แอลกอฮอล์ 70%','',2,'แอลกอฮอล์ 70%.png',NULL),(25,'ยาฆ่าเชื้อใส่แผล','',1,'ยาฆ่าเชื้อใส่แผล.jpg',NULL),(26,'พลาสเตอร์ปิดแผล','',2,'พลาสเตอร์ปิดแผล.jpeg',NULL),(27,'ผ้าก๊อซปลอดเชื้อ','',2,'ผ้าก๊อซปลอดเชื้อ.jpg',NULL),(28,'เทปปิดแผล','',2,'เทปปิดแผล.jpg',NULL),(29,'แผ่นดึงขอบแผล','',2,'แผ่นดึงขอบแผล.jpg',NULL),(30,'พาราเซตามอล','',1,'พาราเซตามอล.jpg',NULL),(31,'ผ้าก๊อซหนา','',2,'ผ้าก๊อซหนา.jpg',NULL),(32,'ผ้าพันแผล','',2,'ผ้าพันแผล.jpg',NULL),(33,'แผ่นปิดแผลปลอดเชื้อขนาดใหญ่','',2,'แผ่นปิดแผลปลอดเชื้อขนาดใหญ่.jpg',NULL),(34,'แผ่นปิดแผลไฮโดรคอลลอยด์','',2,'แผ่นปิดแผลไฮโดรคอลลอยด์.jpg',NULL),(35,'พลาสเตอร์แผลถลอก','',2,'พลาสเตอร์แผลถลอก.jpg',NULL),(36,'เจลลดความร้อน','',1,'เจลลดความร้อน.jpg',NULL),(37,'ไฮโดรเจลแพด','',2,'ไฮโดรเจลแพด.jpg',NULL),(38,'ผ้าก๊อซแบบไม่ติดแผล','',2,'ผ้าก๊อซแบบไม่ติดแผล.png',NULL),(39,'ครีมสำหรับแผลไหม้','',1,'ครีมสำหรับแผลไหม้.jpg',NULL),(40,'เจลบรรเทาอาการฟกช้ำ','',1,'เจลบรรเทาอาการฟกช้ำ.jpeg',NULL),(41,'อุปกรณ์สำหรับประคบเย็น','',2,'อุปกรณ์สำหรับประคบเย็น.jpg',NULL),(42,'ผ้ายืดพันเคล็ด','',2,'ผ้ายืดพันเคล็ด.jpg',NULL),(43,'น้ำเกลือ 500 ลิตร',NULL,2,'59d8a116-7d88-4894-b57a-7a2ee510c861.jpg',1);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recom_search_hospital`
--

DROP TABLE IF EXISTS `recom_search_hospital`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recom_search_hospital` (
  `hospital_id` int NOT NULL AUTO_INCREMENT,
  `hospital_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `hospital_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`hospital_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recom_search_hospital`
--

LOCK TABLES `recom_search_hospital` WRITE;
/*!40000 ALTER TABLE `recom_search_hospital` DISABLE KEYS */;
/*!40000 ALTER TABLE `recom_search_hospital` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recommendation`
--

DROP TABLE IF EXISTS `recommendation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recommendation` (
  `recommend_id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `recommend_text` longtext COLLATE utf8mb4_unicode_ci,
  `warning_note` longtext COLLATE utf8mb4_unicode_ci,
  `risk` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pro_reccom` longtext COLLATE utf8mb4_unicode_ci,
  `prediction_id` int DEFAULT NULL,
  `hospital_id` int DEFAULT NULL,
  PRIMARY KEY (`recommend_id`),
  KEY `FK_d6d0b94c2fdcdaf4dc33bb071c3` (`prediction_id`),
  CONSTRAINT `FK_d6d0b94c2fdcdaf4dc33bb071c3` FOREIGN KEY (`prediction_id`) REFERENCES `prediction` (`prediction_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recommendation`
--

LOCK TABLES `recommendation` WRITE;
/*!40000 ALTER TABLE `recommendation` DISABLE KEYS */;
INSERT INTO `recommendation` VALUES (6,'2026-08-19 22:40:40.937144','ล้างมือให้สะอาดก่อนสัมผัสแผล\nล้างแผลด้วยน้ำสะอาดหรือน้ำเกลือ\nนำเศษดินหรือสิ่งสกปรกออกจากแผล\nซับแผลให้แห้งด้วยผ้าสะอาด\nทายาฆ่าเชื้อเบื้องต้น\nปิดแผลด้วยผ้าก๊อซหรือพลาสเตอร์หากจำเป็น\nหากแผลบวมแดงหรือมีหนอง ควรพบแพทย์','ข้อมูลนี้เป็นการปฐมพยาบาลเบื้องต้น ไม่สามารถทดแทนแพทย์ได้','สูง','น้ำเกลือล้างแผล, เบตาดีน, ผ้าก๊อซ, แผ่นปิดแผลไฮโดรคอลลอยด์, พลาสเตอร์แผลถลอก, ยาฆ่าเชื้อใส่แผล, พาราเซตามอล',12,NULL),(7,'2026-08-19 23:18:32.517455','ประคบเย็นบริเวณที่ฟกช้ำทันที\nประคบครั้งละประมาณ 15–20 นาที\nทำซ้ำทุก 2–3 ชั่วโมงในช่วง 24–48 ชั่วโมงแรก\nยกบริเวณที่บาดเจ็บให้สูงกว่าระดับหัวใจหากสามารถทำได้\nหลีกเลี่ยงการนวดแรงบริเวณที่ฟกช้ำ\nหากปวดมาก บวมมาก หรือเคลื่อนไหวลำบาก ควรพบแพทย์','ข้อมูลนี้เป็นการปฐมพยาบาลเบื้องต้น ไม่สามารถทดแทนแพทย์ได้','สูง','เจลบรรเทาอาการฟกช้ำ, อุปกรณ์สำหรับประคบเย็น, ผ้ายืดพันเคล็ด, พาราเซตามอล',13,NULL),(21,'2026-09-28 16:33:07.609574','ล้างมือให้สะอาดก่อนสัมผัสแผล\nล้างแผลด้วยน้ำสะอาดหรือน้ำเกลือ\nนำเศษดินหรือสิ่งสกปรกออกจากแผล\nซับแผลให้แห้งด้วยผ้าสะอาด\nทายาฆ่าเชื้อเบื้องต้น\nปิดแผลด้วยผ้าก๊อซหรือพลาสเตอร์หากจำเป็น\nหากแผลบวมแดงหรือมีหนอง ควรพบแพทย์','ข้อมูลนี้เป็นการปฐมพยาบาลเบื้องต้น ไม่สามารถทดแทนแพทย์ได้','สูง','น้ำเกลือล้างแผล, เบตาดีน, ผ้าก๊อซ, แผ่นปิดแผลไฮโดรคอลลอยด์, พลาสเตอร์แผลถลอก, ยาฆ่าเชื้อใส่แผล, พาราเซตามอล',35,NULL),(22,'2026-09-28 16:37:55.412192','ล้างมือให้สะอาดก่อนสัมผัสแผล\nล้างแผลด้วยน้ำสะอาดหรือน้ำเกลือ\nนำเศษดินหรือสิ่งสกปรกออกจากแผล\nซับแผลให้แห้งด้วยผ้าสะอาด\nปิดแผลด้วยผ้าก๊อซหรือพลาสเตอร์หากจำเป็น\nหากแผลบวมแดงหรือมีหนอง ควรพบแพทย์','ข้อมูลนี้เป็นการปฐมพยาบาลเบื้องต้น ไม่สามารถทดแทนแพทย์ได้','ต่ำ','น้ำเกลือล้างแผล, ผ้าก๊อซ, Hydrocolloid, พลาสเตอร์แผลถลอก, ยาฆ่าเชื้อสำหรับกรณีที่เหมาะสม, พาราเซตามอล',36,NULL);
/*!40000 ALTER TABLE `recommendation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `type_pro`
--

DROP TABLE IF EXISTS `type_pro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `type_pro` (
  `typepro_id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`typepro_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `type_pro`
--

LOCK TABLES `type_pro` WRITE;
/*!40000 ALTER TABLE `type_pro` DISABLE KEYS */;
INSERT INTO `type_pro` VALUES (1,'ยา'),(2,'เวชภัณฑ์');
/*!40000 ALTER TABLE `type_pro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `birthday` date DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `IDX_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (4,'leo','$2b$10$9YPUAMJLZmc.6g2QDBYtqOMoi/N1b5p5987Q/EWfRFmdHxz64vDj.','2005-02-12','2026-10-03 19:33:38','2026-04-05 00:22:09.000000','leoclass12@gmail.com','Bangkok','admin'),(5,'testuser','$2b$10$qqQQBVIc8kATmOdtRC5ArOIPXo4WMVrYujl1mxjJnJjeaJ25VFeme','2005-02-12','2026-10-03 19:21:28','2026-04-12 18:44:14.580952','leoclass12@gmail.com','Bangkok','user'),(8,'tongjai','$2b$10$Tf3LSs7PDQXX9FgowXvKluWjtCZs2mtj1urNLde81Ici8sQWz61f2',NULL,'2026-09-04 13:45:47','2026-09-04 13:42:56.196631',NULL,NULL,'user'),(10,'testuser3','$2b$10$8pfRPq77r/GWjNSsgHp5XubS33q0BvgXm16wv.SV8iRcEyB0kyk.6',NULL,NULL,'2026-09-04 15:11:13.255994',NULL,NULL,'user');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wound_image`
--

DROP TABLE IF EXISTS `wound_image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wound_image` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `upload_date` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `associated_symptom` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `incident_date` date DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `wound_site` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`image_id`),
  KEY `FK_fb676e56c9dd69a78dcba96a078` (`user_id`),
  CONSTRAINT `FK_fb676e56c9dd69a78dcba96a078` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wound_image`
--

LOCK TABLES `wound_image` WRITE;
/*!40000 ALTER TABLE `wound_image` DISABLE KEYS */;
INSERT INTO `wound_image` VALUES (6,'wound-1787154016805-276630661-abrasions (1).jpg','2026-08-19 22:40:16.823321','แสบ','2026-08-08',13.7760000,100.5676910,'ขาขวา',5),(7,'wound-1787156288832-952277759-burn (11).jpg','2026-08-19 23:18:08.847518','ปวด','2026-08-03',13.7760210,100.5677740,'แขนซ้าย',4),(27,'wound-1790374870995-247599713-Screenshot 2026-09-06 165457.jpg','2026-09-26 05:21:11.009407','ไม่มี','2026-09-05',NULL,NULL,'ขา',5),(28,'wound-1790586798639-845108810-Screenshot 2026-09-06 165737.jpg','2026-09-28 16:13:18.652809','ไม่มี','2026-09-28',13.7759840,100.5673030,'ขา',4),(29,'wound-1790587965386-69339563-Screenshot 2026-08-27 203037.jpg','2026-09-28 16:32:45.393879','แสบ','2026-09-28',13.7759840,100.5673760,'ขาขวา',5),(30,'wound-1790588263667-227227992-Screenshot 2026-08-27 202810.jpg','2026-09-28 16:37:43.683367','แสบ','2026-09-28',13.7757660,100.5672900,'ท้อง',5);
/*!40000 ALTER TABLE `wound_image` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-03 19:49:28
