using System.IO.Compression;
using System.Xml;

namespace DisasterReliefSystem.API.Infrastructure;

// Minimal standards-compliant XLSX. Every cell is an inline string so untrusted
// user-entered text cannot become an Excel formula when the report is opened.
public static class ExcelExport
{
    public static byte[] Create(IEnumerable<string[]> rows)
    {
        using var stream = new MemoryStream();
        using (var zip = new ZipArchive(stream, ZipArchiveMode.Create, true))
        {
            Write(zip, "[Content_Types].xml", """<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>""");
            Write(zip, "_rels/.rels", """<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>""");
            Write(zip, "xl/workbook.xml", """<?xml version="1.0" encoding="utf-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="ReliefConnect" sheetId="1" r:id="rId1"/></sheets></workbook>""");
            Write(zip, "xl/_rels/workbook.xml.rels", """<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>""");
            using var entry = zip.CreateEntry("xl/worksheets/sheet1.xml").Open();
            using var writer = XmlWriter.Create(entry, new XmlWriterSettings { Encoding = new System.Text.UTF8Encoding(false) });
            writer.WriteStartDocument(); writer.WriteStartElement("worksheet", "http://schemas.openxmlformats.org/spreadsheetml/2006/main"); writer.WriteStartElement("sheetData");
            foreach (var row in rows)
            {
                writer.WriteStartElement("row");
                foreach (var cell in row)
                {
                    writer.WriteStartElement("c"); writer.WriteAttributeString("t", "inlineStr"); writer.WriteStartElement("is");
                    writer.WriteStartElement("t"); writer.WriteString(Clean(cell)); writer.WriteEndElement(); writer.WriteEndElement(); writer.WriteEndElement();
                }
                writer.WriteEndElement();
            }
            writer.WriteEndElement(); writer.WriteEndElement(); writer.WriteEndDocument();
        }
        return stream.ToArray();
    }
    private static string Clean(string? value) => new((value ?? "").Where(XmlConvert.IsXmlChar).Take(32767).ToArray());
    private static void Write(ZipArchive zip, string name, string value)
    {
        using var stream = zip.CreateEntry(name).Open(); using var writer = new StreamWriter(stream, new System.Text.UTF8Encoding(false)); writer.Write(value);
    }
}
