/*
 Navicat Premium Data Transfer

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80031
 Source Host           : localhost:3306
 Source Schema         : plague-prevention

 Target Server Type    : MySQL
 Target Server Version : 80031
 File Encoding         : 65001

 Date: 29/01/2023 20:59:39
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for academy
-- ----------------------------
DROP TABLE IF EXISTS `academy`;
CREATE TABLE `academy`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '序号',
  `academyName` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '院校名',
  `principal` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '负责人',
  `academyId` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '院校ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for address
-- ----------------------------
DROP TABLE IF EXISTS `address`;
CREATE TABLE `address`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '序号',
  `addressName` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '地址名称',
  `addressId` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '地址ID',
  `addressType` tinyint(0) NULL DEFAULT NULL COMMENT '地址类型：0：教学楼，1：宿舍，2：其他',
  `completeAddress` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '具体地址',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for administratorcount
-- ----------------------------
DROP TABLE IF EXISTS `administratorcount`;
CREATE TABLE `administratorcount`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '序号',
  `name` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '用户名',
  `phoneNumber` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '联系方式',
  `eMail` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '邮箱',
  `password` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '密码',
  `grade` tinyint(1) NULL DEFAULT NULL COMMENT '等级：1：管理员，0：超级管理员',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for check-info
-- ----------------------------
DROP TABLE IF EXISTS `check-info`;
CREATE TABLE `check-info`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `spaceAddress` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '当前市/区',
  `addressDetail` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '具体地址',
  `imageUrl` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL,
  `tempStatus` tinyint(1) NULL DEFAULT NULL COMMENT '体温状态',
  `healthStatus` tinyint(0) UNSIGNED NULL DEFAULT NULL COMMENT '健康状态',
  `inschool` tinyint(1) NULL DEFAULT NULL COMMENT '是否在校:0:离校，1：在校',
  `checkTime` datetime(6) NULL DEFAULT NULL COMMENT '打卡时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for disease
-- ----------------------------
DROP TABLE IF EXISTS `disease`;
CREATE TABLE `disease`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `diseaseName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '疾病名称',
  `symptom` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '症状',
  `diagnosticWay` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '诊断方式',
  `infectionWay` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '传染途径',
  `deaths` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '已死亡人数',
  `treatmentMeans` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '治疗手段',
  `earliestTime` datetime(6) NULL DEFAULT NULL COMMENT '最早发生时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for exception
-- ----------------------------
DROP TABLE IF EXISTS `exception`;
CREATE TABLE `exception`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `status` tinyint(1) NULL DEFAULT NULL COMMENT '状态，0：疑似，1：确诊',
  `departmen` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '院系',
  `userNumber` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '学/工号',
  `startTime` datetime(6) NULL DEFAULT NULL COMMENT '开始时间',
  `phoneNumber` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '联系方式',
  `remarks` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for feedback
-- ----------------------------
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '标题',
  `content` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '内容',
  `time` datetime(6) NULL DEFAULT NULL COMMENT '反馈时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for leave-info
-- ----------------------------
DROP TABLE IF EXISTS `leave-info`;
CREATE TABLE `leave-info`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `issue` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '请假原因',
  `department` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '院系',
  `leaveDate` datetime(6) NULL DEFAULT NULL COMMENT '离校时间',
  `returnDate` datetime(6) NULL DEFAULT NULL COMMENT '返校时间',
  `transport` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '交通工具',
  `applyDate` datetime(6) NULL DEFAULT NULL COMMENT '申请时间',
  `userNumber` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '学号',
  `applyStatus` tinyint(0) NULL DEFAULT NULL COMMENT '审批状态：0：待审批，1：已通过，2：未通过，3：已核销',
  `approvalOpinion` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '审批意见',
  `inschool` tinyint(1) NULL DEFAULT NULL COMMENT '在校状态：0：离校，1：在校',
  `transitImg` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '通行证明',
  `remark` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for message
-- ----------------------------
DROP TABLE IF EXISTS `message`;
CREATE TABLE `message`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '序号',
  `type` int(0) NULL DEFAULT NULL COMMENT '类型',
  `title` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '标题',
  `content` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '内容',
  `sendRange` int(0) NULL DEFAULT NULL COMMENT '发送范围，0：个人，1：全院，2：全校',
  `sendTime` datetime(6) NULL DEFAULT NULL COMMENT '发送时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for notice-info
-- ----------------------------
DROP TABLE IF EXISTS `notice-info`;
CREATE TABLE `notice-info`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `title` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '标题',
  `content` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '内容',
  `releaseDate` datetime(6) NULL DEFAULT NULL COMMENT '发布日期',
  `releasePeople` varchar(10) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '发布人',
  `releaseState` tinyint(1) NULL DEFAULT NULL COMMENT '发布状态：0：未发布，1：已发布',
  `releaseRange` tinyint(0) NULL DEFAULT NULL COMMENT '发布范围：0：个人，1：全院，2：全校',
  `remarks` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for prevent-info
-- ----------------------------
DROP TABLE IF EXISTS `prevent-info`;
CREATE TABLE `prevent-info`  (
  `id` int(0) NOT NULL AUTO_INCREMENT,
  `address` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '地点',
  `type` int(0) NULL DEFAULT NULL COMMENT '类型：0：常规检测，1：医疗诊治，2：其它',
  `materialSituation` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '物资情况',
  `time` datetime(6) NULL DEFAULT NULL COMMENT '时间',
  `manager` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '负责人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb3 COLLATE = utf8mb3_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` int(0) NOT NULL AUTO_INCREMENT COMMENT '序号',
  `userNumber` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '学/工号',
  `department` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '院系',
  `userName` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '姓名',
  `address` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '地址',
  `inschool` tinyint(1) NULL DEFAULT NULL COMMENT '是否在校：1：在校，0：离校',
  `sex` tinyint(1) NULL DEFAULT NULL COMMENT '性别:1:男，0：女',
  `age` int(0) NULL DEFAULT NULL COMMENT '年龄',
  `entryDate` datetime(6) NULL DEFAULT NULL COMMENT '入校时间',
  `recentTime` datetime(6) NULL DEFAULT NULL COMMENT '最近返校时间',
  `office` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '职务',
  `phoneNumber` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '手机号码',
  `password` varchar(20) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '密码',
  `imag` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NULL DEFAULT NULL COMMENT '头像',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
