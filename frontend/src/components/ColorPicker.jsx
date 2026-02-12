import { useState } from 'react'
import { Check } from 'lucide-react'

const ColorPicker = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false)

  const colors = [
    { name: 'Blue', value: '#2563EB' },
    { name: 'Red', value: '#DC2626' },
    { name: 'Green', value: '#16A34A' },
    { name: 'Purple', value: '#9333EA' },
    { name: 'Orange', value: '#EA580C' },
    { name: 'Pink', value: '#DB2777' },
    { name: 'Teal', value: '#0D9488' },
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Yellow', value: '#CA8A04' },
    { name: 'Cyan', value: '#0891B2' },
    { name: 'Rose', value: '#E11D48' },
    { name: 'Emerald', value: '#059669' },
  ]

  const selectedColor = colors.find(c => c.value === value) || colors[0]

  return (
    <div className="relative">
      {label && (
        <label className="label">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors"
      >
        <div 
          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: selectedColor.value }}
        />
        <span className="text-gray-700">{selectedColor.name}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 z-20 w-64">
            <div className="grid grid-cols-4 gap-2">
              {colors.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    onChange(color.value)
                    setIsOpen(false)
                  }}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-transform hover:scale-110 ${
                    value === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {value === color.value && (
                    <Check className="text-white" size={20} />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label className="text-xs text-gray-500 block mb-1">Custom Color</label>
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-8 cursor-pointer rounded border border-gray-300"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ColorPicker
