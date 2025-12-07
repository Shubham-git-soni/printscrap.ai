-- PrintScrap.ai Database Schema
-- MSSQL Database

-- Users Table
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'client')),
    companyName NVARCHAR(255),
    contactNumber NVARCHAR(50),
    address NVARCHAR(MAX),
    isActive BIT DEFAULT 0,
    isVerified BIT DEFAULT 0,
    subscriptionId INT,
    verificationToken NVARCHAR(500),
    createdAt DATETIME DEFAULT GETDATE()
);

-- Plans Table
CREATE TABLE Plans (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    price DECIMAL(10, 2) NOT NULL,
    billingCycle NVARCHAR(50) NOT NULL,
    features NVARCHAR(MAX) -- Stored as JSON string
);

-- Subscriptions Table
CREATE TABLE Subscriptions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    planId INT NOT NULL,
    status NVARCHAR(50) NOT NULL CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    autoRenew BIT DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (planId) REFERENCES Plans(id)
);

-- Categories Table
CREATE TABLE Categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    marketRate DECIMAL(10, 2) NOT NULL,
    unit NVARCHAR(50) NOT NULL,
    createdBy INT NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Users(id)
);

-- SubCategories Table
CREATE TABLE SubCategories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    categoryId INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    size NVARCHAR(100),
    unit NVARCHAR(50),
    remarks NVARCHAR(MAX),
    createdBy INT NOT NULL,
    FOREIGN KEY (categoryId) REFERENCES Categories(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES Users(id)
);

-- Units Table
CREATE TABLE Units (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    symbol NVARCHAR(20) NOT NULL,
    createdBy INT NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Users(id)
);

-- Departments Table
CREATE TABLE Departments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    createdBy INT NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Users(id)
);

-- Machines Table
CREATE TABLE Machines (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    departmentId INT NOT NULL,
    model NVARCHAR(255),
    manufacturer NVARCHAR(255),
    createdBy INT NOT NULL,
    FOREIGN KEY (departmentId) REFERENCES Departments(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES Users(id)
);

-- ScrapEntries Table
CREATE TABLE ScrapEntries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    entryType NVARCHAR(50) NOT NULL CHECK (entryType IN ('job-based', 'general')),
    categoryId INT NOT NULL,
    subCategoryId INT,
    departmentId INT NOT NULL,
    machineId INT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit NVARCHAR(50) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL,
    totalValue DECIMAL(10, 2) NOT NULL,
    jobNumber NVARCHAR(255),
    remarks NVARCHAR(MAX),
    createdBy INT NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (categoryId) REFERENCES Categories(id),
    FOREIGN KEY (subCategoryId) REFERENCES SubCategories(id),
    FOREIGN KEY (departmentId) REFERENCES Departments(id),
    FOREIGN KEY (machineId) REFERENCES Machines(id),
    FOREIGN KEY (createdBy) REFERENCES Users(id)
);

-- Stock Table
CREATE TABLE Stock (
    id INT IDENTITY(1,1) PRIMARY KEY,
    categoryId INT NOT NULL,
    subCategoryId INT,
    userId INT NOT NULL,
    totalInflow DECIMAL(10, 2) DEFAULT 0,
    totalOutflow DECIMAL(10, 2) DEFAULT 0,
    availableStock DECIMAL(10, 2) DEFAULT 0,
    unit NVARCHAR(50) NOT NULL,
    averageRate DECIMAL(10, 2) DEFAULT 0,
    totalValue DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (categoryId) REFERENCES Categories(id),
    FOREIGN KEY (subCategoryId) REFERENCES SubCategories(id),
    FOREIGN KEY (userId) REFERENCES Users(id),
    UNIQUE (categoryId, subCategoryId, userId)
);

-- Sales Table
CREATE TABLE Sales (
    id INT IDENTITY(1,1) PRIMARY KEY,
    invoiceNumber NVARCHAR(50) UNIQUE NOT NULL,
    buyerName NVARCHAR(255) NOT NULL,
    buyerContact NVARCHAR(100),
    totalAmount DECIMAL(10, 2) NOT NULL,
    remarks NVARCHAR(MAX),
    saleDate DATETIME DEFAULT GETDATE(),
    createdBy INT NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES Users(id)
);

-- SaleItems Table
CREATE TABLE SaleItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    saleId INT NOT NULL,
    categoryId INT NOT NULL,
    subCategoryId INT,
    quantity DECIMAL(10, 2) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL,
    totalValue DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (saleId) REFERENCES Sales(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES Categories(id),
    FOREIGN KEY (subCategoryId) REFERENCES SubCategories(id)
);

-- PlanActivationRequests Table
CREATE TABLE PlanActivationRequests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    planId INT NOT NULL,
    status NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requestMessage NVARCHAR(MAX),
    requestedAt DATETIME DEFAULT GETDATE(),
    approvedBy INT NULL,
    approvalNotes NVARCHAR(MAX) NULL,
    approvedAt DATETIME NULL,
    FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (planId) REFERENCES Plans(id),
    FOREIGN KEY (approvedBy) REFERENCES Users(id)
);

-- Insert Default Super Admin
INSERT INTO Users (email, password, role, companyName, isActive, isVerified)
VALUES ('admin@printscrap.ai', 'admin123', 'super_admin', 'PrintScrap.ai', 1, 1);

-- -- Insert Default Plans
-- INSERT INTO Plans (name, description, price, billingCycle, features)
-- VALUES
-- ('Basic', 'Perfect for small businesses', 999.00, 'month', '["Up to 100 scrap entries/month","Basic inventory tracking","Email support","1 user account"]'),
-- ('Professional', 'Ideal for growing businesses', 2499.00, 'month', '["Unlimited scrap entries","Advanced inventory & analytics","Priority email & phone support","Up to 5 user accounts","Custom categories"]'),
-- ('Enterprise', 'For large organizations', 4999.00, 'month', '["Everything in Professional","Dedicated account manager","24/7 premium support","Unlimited user accounts","API access","Custom integrations"]');

-- -- Insert Default Categories
-- INSERT INTO Categories (name, marketRate, unit, createdBy)
-- VALUES
-- ('Paper', 15.50, 'Kg', 1),
-- ('Plastic', 12.00, 'Kg', 1),
-- ('Metal', 45.00, 'Kg', 1);

-- -- Insert Default Units
-- INSERT INTO Units (name, symbol, createdBy)
-- VALUES
-- ('Kilogram', 'Kg', 1),
-- ('Numbers', 'Nos', 1),
-- ('Tons', 'Tons', 1),
-- ('Meters', 'm', 1);

-- -- Insert Default Departments
-- INSERT INTO Departments (name, description, createdBy)
-- VALUES
-- ('Printing', 'Main printing department', 1),
-- ('Binding', 'Book binding section', 1),
-- ('Cutting', 'Paper cutting and finishing', 1);