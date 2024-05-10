const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const libreoffice = require("libreoffice-convert");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
}).single("file");

app.post("/convertDocxToPdf", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Check if a file has been uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const inputFilePath = req.file.path;
    const outputPath = "output.pdf";

    fs.readFile(inputFilePath, (err, data) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      libreoffice.convert(data, ".pdf", undefined, (err, done) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        fs.writeFile(outputPath, done, (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Delete the uploaded file after conversion
          fs.unlinkSync(inputFilePath);

          // Read the converted PDF data
          fs.readFile(outputPath, (err, pdfData) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            // Delete the converted PDF file
            fs.unlinkSync(outputPath);

            // Send response with PDF data
            res.set('Content-Type', 'application/pdf');
            res.send(pdfData);
          });
        });
      });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
