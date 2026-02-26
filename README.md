
# 🚀 Servicio Constitucional

Sistema de gestión de vinculaciones y contratos para empresas, que permite registrar empresas, apoderados, titulares y contratos, y hacer seguimiento de su vigencia de manera sencilla y clara.

---

## 🛠 Tecnologías
- **Node.js**  
- **Express**  
- **MongoDB** (Mongoose)  
- **EJS** (vistas dinámicas)  
- **Otros paquetes**: dotenv, body-parser, nodemon

---

## ⚡ Instalación

Sigue estos pasos para ejecutar el proyecto localmente en Windows:

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/tu_usuario/tu_repositorio.git
cd tu_repositorio
````

### 2️⃣ Instalar dependencias

```bash
npm install
```

### 3️⃣ Crear archivo `.env`

En la raíz del proyecto, crea un archivo `.env` con las variables:

```env
PORT=3000
DB_URI=mongodb://localhost:27017/servicio_constitucional
```

> Cambia `servicio_constitucional` por el nombre de la base de datos que quieras usar.

### 4️⃣ (Opcional) Cargar datos de prueba

Si existe un archivo `seed.js`:

```bash
node seed.js
```

### 5️⃣ Ejecutar el proyecto

```bash
npm start
```

### 6️⃣ Abrir en el navegador

[http://localhost:3000](http://localhost:3000)

---

## 💾 Archivos subidos

Los archivos que se suben desde la aplicación se guardan en la carpeta:

```
uploads/
```

* Esta carpeta debe existir en la raíz del proyecto.
* MongoDB solo guarda la **ruta del archivo**, no el archivo en sí.
* Agrega `uploads/` a tu `.gitignore` para no subir archivos grandes al repositorio.

---

## ✨ Funcionalidades principales

* Registro de **empresas** y **apoderados legales**.
* Gestión de **vinculaciones** y **contratos**.
* Visualización de contratos **activos**, **próximos a vencer** y **expirados**.
* Registro de **fechas de firma** y seguimiento de vigencia.
* Conteo de contratos **nacionales** e **internacionales**.

---

## 📂 Estructura del proyecto

```
src/
 ├─ config/       # Configuración de la base de datos
 ├─ models/       # Modelos de MongoDB
 ├─ routes/       # Rutas de Express
 ├─ views/        # Vistas (EJS)
package.json      # Dependencias y scripts
.env              # Variables de entorno (no subir al repo)
uploads/          # Archivos subidos (no subir al repo)
```

---

## ⚠️ Notas importantes

* **No subir** `node_modules` ni `.env` al repositorio.
* Sigue **INSTALACION.txt** si hay problemas con la instalación.
* Asegúrate de que **MongoDB esté corriendo** antes de iniciar la aplicación.

---



INSTALACION DEL PROYECTO 

1️⃣ Clonar el repositorio:
git clone https://github.com/tu_usuario/tu_repositorio.git

cd tu_repositorio

2️⃣ Instalar dependencias:
npm install

3️⃣ Crear archivo .env en la raíz:
PORT=3000
DB_URI=mongodb://localhost:27017/servicio_constitucional

4️⃣ Crear carpeta uploads/ en la raíz para archivos subidos

5️⃣ Instalar MongoDB si no está instalado:
https://www.mongodb.com/try/download/community

Asegurarse que el servicio esté corriendo

6️⃣ (Opcional) Cargar datos de prueba:
node seed.js

7️⃣ Ejecutar proyecto:
npm start

8️⃣ Abrir en el navegador:
http://localhost:3000

⚠️ Notas:

No subir node_modules ni .env

La carpeta uploads/ debe existir antes de subir archivos

MongoDB debe estar corriendo antes de iniciar la app


## 👩‍💻 Autor

**Nathalie Maldonado** – 
