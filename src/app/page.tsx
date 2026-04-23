'use client';

import { useState, useEffect } from 'react';

interface Dog {
  id: string;
  originalId: string;
  name: string;
  gender: string;
  location: string;
  color: string;
  description: string;
  collar: string;
  neuteringStatus: string;
  vaccinationStatus: string;
  vaccinationDate: string;
  imageLinks: string[];
}

export default function HomePage() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDogs = async () => {
      try {
        const response = await fetch('/CSV/Dog ID - dog id(Sheet1).csv');
        const csvText = await response.text();
        
        // Better CSV parsing that handles quoted fields
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        const dogsData = lines.slice(1).filter(line => line.trim()).map((line, index) => {
          // Parse CSV properly handling quoted fields
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          
          // Convert Google Drive URLs to direct image URLs - ONLY from CSV
          const rawImageLinks = result[12] ? result[12].split(' ').filter(url => url.trim()) : [];
          const imageLinks = rawImageLinks.map(url => {
            if (url.includes('/file/d/')) {
              // Convert file URL to direct image URL
              const fileId = url.match(/\/file\/d\/([^/?]+)/);
              if (fileId) {
                const id = fileId[1];
                console.log('Processing image ID:', id, 'from URL:', url);
                // Use the format that should work
                return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
              }
            }
            return url;
          }).filter(url => url.includes('drive.google.com')); // Only keep Google Drive URLs
          
          return {
            id: `D${index + 1}`,
            originalId: result[0] || '',
            name: result[2] || '',
            gender: result[1] || '',
            location: result[3] || '',
            color: result[4] || '',
            description: result[5] ? result[5].replace(/"/g, '') : '',
            collar: result[6] || '',
            neuteringStatus: result[7] || '',
            vaccinationStatus: result[8] === 'not vaccinated' ? 'not vaccinated' : 'vaccinated',
            vaccinationDate: result[8] || '',
            imageLinks: imageLinks
          };
        }).filter(dog => dog.originalId);
        
        setDogs(dogsData);
      } catch (error) {
        console.error('Error loading dogs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDogs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 text-lg">Loading dogs...</p>
        </div>
      </div>
    );
  }

  if (selectedDog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button 
            onClick={() => setSelectedDog(null)}
            className="mb-6 flex items-center text-green-700 hover:text-green-900 transition-colors"
          >
            ← Back to all dogs
          </button>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="relative h-96 bg-gray-100">
              {selectedDog.imageLinks.length > 0 ? (
                <img 
                  src={selectedDog.imageLinks[0]} 
                  alt={selectedDog.originalId}
                  className="w-full h-full object-cover"
                  onLoad={() => console.log('Detail image loaded:', selectedDog.imageLinks[0])}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log('Detail image failed:', selectedDog.imageLinks[0]);
                    target.style.display = 'none';
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-green-100 to-amber-100 flex items-center justify-center">
                        <div class="text-center">
                          <div class="text-8xl mb-4">🐕</div>
                          <div class="text-2xl text-gray-700 font-semibold">${selectedDog.originalId}</div>
                          <div class="text-sm text-gray-500 mt-2">Image failed to load</div>
                        </div>
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-amber-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">🐕</div>
                    <div className="text-2xl text-gray-700 font-semibold">{selectedDog.originalId}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedDog.originalId}</h1>
              {selectedDog.name && <p className="text-xl text-gray-600 mb-4">Pet name: {selectedDog.name}</p>}
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h2>
                  <div className="space-y-2">
                    <p><span className="font-medium">Gender:</span> {selectedDog.gender}</p>
                    <p><span className="font-medium">Location:</span> {selectedDog.location}</p>
                    <p><span className="font-medium">Color:</span> {selectedDog.color}</p>
                    <p><span className="font-medium">Collar:</span> {selectedDog.collar}</p>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Health Status</h2>
                  <div className="space-y-2">
                    <p><span className="font-medium">Neutering:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedDog.neuteringStatus === 'neutered' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedDog.neuteringStatus}
                      </span>
                    </p>
                    <p><span className="font-medium">Vaccination:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedDog.vaccinationStatus === 'vaccinated' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedDog.vaccinationStatus}
                      </span>
                    </p>
                    {selectedDog.vaccinationDate && selectedDog.vaccinationDate !== 'not vaccinated' && (
                      <p><span className="font-medium">Vaccination Date:</span> {selectedDog.vaccinationDate}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedDog.description && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-700">{selectedDog.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-green-800 mb-4">🐕 Dogs of IISER</h1>
          <p className="text-xl text-gray-700">A living registry of campus community dogs</p>
        </header>

        <div className="mb-8 text-center">
          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-lg font-medium">
            Total: {dogs.length} dogs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {dogs.map((dog) => (
            <div 
              key={dog.id} 
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden"
              onClick={() => setSelectedDog(dog)}
            >
              <div className="relative h-48 bg-gray-100">
                {dog.imageLinks.length > 0 ? (
                  <img 
                    src={dog.imageLinks[0]} 
                    alt={dog.originalId}
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('Image loaded successfully:', dog.imageLinks[0])}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log('Image failed to load:', dog.imageLinks[0]);
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-green-100 to-amber-100 flex items-center justify-center">
                          <div class="text-center">
                            <div class="text-6xl mb-2">🐕</div>
                            <div class="text-sm text-gray-600">${dog.originalId}</div>
                            <div class="text-xs text-gray-500 mt-1">Image failed to load</div>
                          </div>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-amber-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-2">🐕</div>
                      <div className="text-sm text-gray-600">{dog.originalId}</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{dog.originalId}</h3>
                {dog.name && <p className="text-sm text-gray-600 mb-2">🏷️ {dog.name}</p>}
                
                {dog.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{dog.description}</p>
                )}
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">📍 {dog.location}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      dog.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                    }`}>
                      {dog.gender}
                    </span>
                  </div>
                  
                  <div className="flex gap-1 mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      dog.neuteringStatus === 'neutered' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dog.neuteringStatus === 'neutered' ? 'N' : 'NN'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      dog.vaccinationStatus === 'vaccinated' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {dog.vaccinationStatus === 'vaccinated' ? 'V' : 'NV'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
