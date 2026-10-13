"""Extract synthetic Chromium PDF text and bounding boxes for print QA."""
import sys
import xml.etree.ElementTree as ET
import pdfplumber

root = ET.Element("document")
with pdfplumber.open(sys.argv[1]) as pdf:
    for page in pdf.pages:
        node = ET.SubElement(root, "page", width=str(page.width), height=str(page.height))
        lines = []
        for word in page.extract_words(x_tolerance=2, y_tolerance=3):
            line = next((line for line in lines if abs(line[0] - word["top"]) < 3), None)
            if line is None:
                line = (word["top"], [])
                lines.append(line)
            line[1].append(word)
        for top, words in sorted(lines):
            row = ET.SubElement(node, "line", yMin=str(top))
            for word in sorted(words, key=lambda item: item["x0"]):
                element = ET.SubElement(row, "word", xMin=str(word["x0"]), xMax=str(word["x1"]), yMin=str(word["top"]), yMax=str(word["bottom"]))
                element.text = word["text"]
                element.tail = " "
sys.stdout.buffer.write(ET.tostring(root, encoding="utf-8"))
