-- ======================================================
-- CREACION DE BASE DE DATOS
-- CONCRE INNOVA
-- SQL SERVER
-- ======================================================

CREATE DATABASE ConcreInnovaDB;
GO

USE ConcreInnovaDB;
GO

-- ======================================================
-- TABLA ROLES
-- ======================================================

CREATE TABLE Roles (
    IdRol INT PRIMARY KEY IDENTITY(1,1),
    NombreRol VARCHAR(50) NOT NULL,
    Descripcion VARCHAR(255)
);

-- ======================================================
-- TABLA USUARIOS
-- ======================================================

CREATE TABLE Usuarios (
    IdUsuario INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Correo VARCHAR(150) UNIQUE NOT NULL,
    ContrasenaHash VARCHAR(255) NOT NULL,
    Telefono VARCHAR(20),
    Estado VARCHAR(20) DEFAULT 'Activo',
    FechaRegistro DATETIME DEFAULT GETDATE(),
    IdRol INT NOT NULL,

    CONSTRAINT FK_Usuarios_Roles
        FOREIGN KEY (IdRol)
        REFERENCES Roles(IdRol)
);

-- ======================================================
-- TABLA CLIENTES
-- ======================================================

CREATE TABLE Clientes (
    IdCliente INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Correo VARCHAR(150) UNIQUE,
    Telefono VARCHAR(20),
    Direccion VARCHAR(255),
    FechaRegistro DATETIME DEFAULT GETDATE(),
    Estado VARCHAR(20) DEFAULT 'Activo'
);

-- ======================================================
-- TABLA CATEGORIAS
-- ======================================================

CREATE TABLE Categorias (
    IdCategoria INT PRIMARY KEY IDENTITY(1,1),
    NombreCategoria VARCHAR(100) NOT NULL,
    Descripcion VARCHAR(255),
    Estado VARCHAR(20) DEFAULT 'Activo'
);

-- ======================================================
-- TABLA PRODUCTOS
-- ======================================================

CREATE TABLE Productos (
    IdProducto INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(150) NOT NULL,
    Descripcion TEXT,
    Precio DECIMAL(10,2) NOT NULL,
    Stock INT DEFAULT 0,
    Imagen VARCHAR(255),
    Estado VARCHAR(20) DEFAULT 'Activo',
    FechaRegistro DATETIME DEFAULT GETDATE(),
    IdCategoria INT NOT NULL,

    CONSTRAINT FK_Productos_Categorias
        FOREIGN KEY (IdCategoria)
        REFERENCES Categorias(IdCategoria)
);

-- ======================================================
-- TABLA INVENTARIO
-- ======================================================

CREATE TABLE Inventario (
    IdInventario INT PRIMARY KEY IDENTITY(1,1),
    IdProducto INT NOT NULL,
    CantidadDisponible INT NOT NULL,
    CantidadMinima INT DEFAULT 0,
    FechaActualizacion DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Inventario_Productos
        FOREIGN KEY (IdProducto)
        REFERENCES Productos(IdProducto)
);

-- ======================================================
-- TABLA COTIZACIONES
-- ======================================================

CREATE TABLE Cotizaciones (
    IdCotizacion INT PRIMARY KEY IDENTITY(1,1),
    IdCliente INT NOT NULL,
    FechaCotizacion DATETIME DEFAULT GETDATE(),
    Estado VARCHAR(30) DEFAULT 'Pendiente',
    Total DECIMAL(10,2) NOT NULL,

    CONSTRAINT FK_Cotizaciones_Clientes
        FOREIGN KEY (IdCliente)
        REFERENCES Clientes(IdCliente)
);

-- ======================================================
-- TABLA DETALLE COTIZACION
-- ======================================================

CREATE TABLE DetalleCotizacion (
    IdDetalleCotizacion INT PRIMARY KEY IDENTITY(1,1),
    IdCotizacion INT NOT NULL,
    IdProducto INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,

    CONSTRAINT FK_DetalleCotizacion_Cotizacion
        FOREIGN KEY (IdCotizacion)
        REFERENCES Cotizaciones(IdCotizacion),

    CONSTRAINT FK_DetalleCotizacion_Producto
        FOREIGN KEY (IdProducto)
        REFERENCES Productos(IdProducto)
);

-- ======================================================
-- TABLA PEDIDOS
-- ======================================================

CREATE TABLE Pedidos (
    IdPedido INT PRIMARY KEY IDENTITY(1,1),
    IdCliente INT NOT NULL,
    FechaPedido DATETIME DEFAULT GETDATE(),
    Estado VARCHAR(30) DEFAULT 'Pendiente',
    DireccionEntrega VARCHAR(255),
    Total DECIMAL(10,2) NOT NULL,

    CONSTRAINT FK_Pedidos_Clientes
        FOREIGN KEY (IdCliente)
        REFERENCES Clientes(IdCliente)
);

-- ======================================================
-- TABLA DETALLE PEDIDO
-- ======================================================

CREATE TABLE DetallePedido (
    IdDetallePedido INT PRIMARY KEY IDENTITY(1,1),
    IdPedido INT NOT NULL,
    IdProducto INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,

    CONSTRAINT FK_DetallePedido_Pedido
        FOREIGN KEY (IdPedido)
        REFERENCES Pedidos(IdPedido),

    CONSTRAINT FK_DetallePedido_Producto
        FOREIGN KEY (IdProducto)
        REFERENCES Productos(IdProducto)
);

-- ======================================================
-- TABLA VENTAS
-- ======================================================

CREATE TABLE Ventas (
    IdVenta INT PRIMARY KEY IDENTITY(1,1),
    IdPedido INT NOT NULL,
    FechaVenta DATETIME DEFAULT GETDATE(),
    MetodoPago VARCHAR(50),
    EstadoPago VARCHAR(30),
    Total DECIMAL(10,2) NOT NULL,

    CONSTRAINT FK_Ventas_Pedidos
        FOREIGN KEY (IdPedido)
        REFERENCES Pedidos(IdPedido)
);

-- ======================================================
-- TABLA PAGOS
-- ======================================================

CREATE TABLE Pagos (
    IdPago INT PRIMARY KEY IDENTITY(1,1),
    IdVenta INT NOT NULL,
    Monto DECIMAL(10,2) NOT NULL,
    FechaPago DATETIME DEFAULT GETDATE(),
    MetodoPago VARCHAR(50),
    Referencia VARCHAR(100),

    CONSTRAINT FK_Pagos_Ventas
        FOREIGN KEY (IdVenta)
        REFERENCES Ventas(IdVenta)
);

-- ======================================================
-- TABLA BITACORA
-- ======================================================

CREATE TABLE Bitacora (
    IdBitacora INT PRIMARY KEY IDENTITY(1,1),
    IdUsuario INT NOT NULL,
    TablaAfectada VARCHAR(100),
    Operacion VARCHAR(20),
    Descripcion VARCHAR(500),
    FechaHora DATETIME DEFAULT GETDATE(),
    IpUsuario VARCHAR(50),

    CONSTRAINT FK_Bitacora_Usuarios
        FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario)
);

-- ======================================================
-- TABLA NOTIFICACIONES
-- ======================================================

CREATE TABLE Notificaciones (
    IdNotificacion INT PRIMARY KEY IDENTITY(1,1),
    IdUsuario INT NOT NULL,
    Mensaje VARCHAR(500),
    Leida BIT DEFAULT 0,
    FechaEnvio DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Notificaciones_Usuarios
        FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario)
);

-- ======================================================
-- TABLA CHATS
-- ======================================================

CREATE TABLE Chats (
    IdChat INT PRIMARY KEY IDENTITY(1,1),
    IdCliente INT NOT NULL,
    IdUsuario INT NOT NULL,
    FechaInicio DATETIME DEFAULT GETDATE(),
    Estado VARCHAR(30),

    CONSTRAINT FK_Chats_Clientes
        FOREIGN KEY (IdCliente)
        REFERENCES Clientes(IdCliente),

    CONSTRAINT FK_Chats_Usuarios
        FOREIGN KEY (IdUsuario)
        REFERENCES Usuarios(IdUsuario)
);

-- ======================================================
-- TABLA MENSAJES CHAT
-- ======================================================

CREATE TABLE MensajesChat (
    IdMensaje INT PRIMARY KEY IDENTITY(1,1),
    IdChat INT NOT NULL,
    Remitente VARCHAR(100),
    Mensaje VARCHAR(1000),
    FechaHora DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_MensajesChat_Chats
        FOREIGN KEY (IdChat)
        REFERENCES Chats(IdChat)
);

-- ======================================================
-- INSERTS DE EJEMPLO
-- ======================================================

INSERT INTO Roles (NombreRol, Descripcion)
VALUES
('Administrador', 'Control total del sistema'),
('Vendedor', 'Gestiona pedidos y cotizaciones'),
('Cliente', 'Realiza compras y consultas');

INSERT INTO Usuarios
(Nombre, Apellido, Correo, ContrasenaHash, Telefono, IdRol)
VALUES
('Esteban', 'Guzman', 'esteban@concreinnova.com', 'HASH123', '8888-8888', 1),
('Daniel', 'Gutierrez', 'daniel@concreinnova.com', 'HASH456', '7777-7777', 2);

INSERT INTO Categorias
(NombreCategoria, Descripcion)
VALUES
('Cemento', 'Productos de cemento'),
('Herramientas', 'Herramientas de construccion'),
('Materiales', 'Materiales generales');

INSERT INTO Productos
(Nombre, Descripcion, Precio, Stock, IdCategoria)
VALUES
('Cemento Gris 50kg', 'Saco de cemento gris', 8500, 120, 1),
('Pala Industrial', 'Pala reforzada industrial', 15000, 30, 2),
('Arena Fina', 'Arena fina para construccion', 4500, 200, 3);

INSERT INTO Clientes
(Nombre, Apellido, Correo, Telefono, Direccion)
VALUES
('Juan', 'Perez', 'juan@gmail.com', '6000-1111', 'San Jose'),
('Maria', 'Lopez', 'maria@gmail.com', '6000-2222', 'Alajuela');

INSERT INTO Pedidos
(IdCliente, Estado, DireccionEntrega, Total)
VALUES
(1, 'Pendiente', 'San Jose Centro', 25500),
(2, 'Completado', 'Alajuela Centro', 15000);

GO