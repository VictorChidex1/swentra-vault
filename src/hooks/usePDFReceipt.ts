import { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export function usePDFReceipt() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generatePDF = async (element: HTMLElement, filename: string) => {
    try {
      setIsGenerating(true)
      setError(null)

      // 1. Take a high-resolution snapshot of the DOM element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better resolution
        useCORS: true, // Allow external images if any
        logging: false,
        backgroundColor: '#ffffff'
      })

      // 2. Calculate dimensions for A4 paper size in jsPDF
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      // 3. Convert canvas to image data
      const imgData = canvas.toDataURL('image/jpeg', 1.0)

      // 4. Create PDF and add the image
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // If the receipt is longer than one page, handle page breaks
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // 5. Trigger browser download
      pdf.save(filename)
    } catch (err: any) {
      console.error('Failed to generate PDF:', err)
      setError('Failed to generate receipt PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return { generatePDF, isGenerating, error }
}
