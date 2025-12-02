import { Search } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Buscar ferramenta
      </label>

      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl p-3 shadow-sm">
        <Search className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Digite o nome da ferramenta..."
          className="w-full outline-none text-gray-700 placeholder:text-gray-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
