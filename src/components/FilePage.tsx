import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { GoogleDrivePanel } from './GoogleDrivePanel';
import { googleDriveService } from '../storage/GoogleDriveService';
import {
  getSaveDestination,
  onSaveDestinationChange,
  setSaveDestination,
  SaveDestination,
} from '../storage/SaveDestination';

const FilePage: React.FC = () => {
  const { structure, fileAPIobj } = useApp();
  const [disableCompression, setDisableCompression] = useState(false);
  const [saveFormat, setSaveFormat] = useState<'eds' | 'json'>('eds');
  const [saveDestination, setSaveDestinationState] = useState<SaveDestination>(
    getSaveDestination
  );

  useEffect(() => {
    // Initialize checkbox state from structure properties
    if (
      structure &&
      structure.properties &&
      typeof structure.properties.disableEDSCompression !== 'undefined'
    ) {
      setDisableCompression(!!structure.properties.disableEDSCompression);
    }

    // Suggest the save format based on the currently open filename
    if (structure && structure.properties && structure.properties.filename) {
      const lower = structure.properties.filename.toLowerCase();
      if (lower.endsWith('.json')) {
        setSaveFormat('json');
      } else {
        setSaveFormat('eds');
      }
    }
  }, [structure]);

  useEffect(
    () => onSaveDestinationChange(setSaveDestinationState),
    []
  );

  const handleCompressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDisableCompression(checked);
    
    if (structure.properties) {
      structure.properties.disableEDSCompression = checked;
    }
  };

  const handleSave = async (saveAs: boolean) => {
    // Call the global exportjson function that's already implemented
    if (typeof globalThis.exportjson === 'function') {
      globalThis.exportjson(saveAs, saveFormat);
    }
  };

  const handleLoad = async () => {
    setSaveDestination('disk');
    googleDriveService.clearCurrentFile();
    // Call the global loadClicked function
    if (typeof globalThis.loadClicked === 'function') {
      await globalThis.loadClicked();
    }
  };

  const handleMerge = async () => {
    // Call the global importToAppendClicked function
    if (typeof globalThis.importToAppendClicked === 'function') {
      await globalThis.importToAppendClicked();
    }
  };

  const handleNameChange = () => {
    // Call the global HL_enterSettings function for legacy mode
    if (typeof globalThis.HL_enterSettings === 'function') {
      globalThis.HL_enterSettings();
    }
  };

  const supportsFileAPI = !!(window as any).showOpenFilePicker;

  // Render save section based on file API support
  const renderSaveSection = () => {
    if (supportsFileAPI) {
      // Use fileAPI
      if (fileAPIobj.filename != null) {
        return (
          <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                onClick={() => handleSave(false)}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                💾 Opslaan
              </button>
              <button
                onClick={() => handleSave(true)}
                style={{
                  background: 'white',
                  color: 'var(--primary-color)',
                  border: '2px solid var(--primary-color)',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                📁 Opslaan als
              </button>
            </div>
            <div
              style={{
                background: '#f0f9ff',
                borderLeft: '4px solid var(--secondary-color)',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
              }}
            >
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6' }}>
                Laatst geopend of opgeslagen om <strong>{fileAPIobj.lastsaved}</strong> met naam{' '}
                <strong>{fileAPIobj.filename}</strong>
                <br />
                <br />
                Klik op "Opslaan" om bij te werken
              </div>
            </div>
          </>
        );
      } else {
        return (
          <>
            <button
              onClick={() => handleSave(true)}
              style={{
                background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '20px',
              }}
            >
              💾 Opslaan als
            </button>
            <div
              style={{
                background: '#fef3c7',
                borderLeft: '4px solid #f59e0b',
                padding: '12px 16px',
                borderRadius: '6px',
                marginBottom: '16px',
              }}
            >
              <strong style={{ color: '#92400e' }}>⚠️ Opgelet:</strong>
              <span style={{ color: '#92400e' }}>
                {' '}
                Uw werk werd nog niet opgeslagen tijdens deze sessie. Klik op "Opslaan als".
              </span>
            </div>
          </>
        );
      }
    } else {
      // Legacy mode
      return (
        <>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Bestandsnaam:{' '}
              <code
                style={{
                  background: '#f3f4f6',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              >
                {structure.properties?.filename || 'eendraadschema.eds'}
              </code>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleSave(false)}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                  color: 'white',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                💾 Opslaan
              </button>
              <button
                onClick={handleNameChange}
                style={{
                  background: 'white',
                  color: 'var(--primary-color)',
                  border: '2px solid var(--primary-color)',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ✏️ Naam wijzigen
              </button>
            </div>
          </div>
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '16px',
            }}
          >
            U kan het schema opslaan op uw lokale harde schijf voor later gebruik. De standaard-naam
            is eendraadschema.eds. U kan deze wijzigen door op "wijzigen" te klikken. Klik
            vervolgens op "opslaan" en volg de instructies van uw browser. In de meeste gevallen zal
            uw browser het bestand automatisch plaatsen in de Downloads-folder tenzij u uw browser
            instelde dat die eerst een locatie moet vragen.
            <br />
            <br />
            Eens opgeslagen kan het schema later opnieuw geladen worden door in het menu "openen" te
            kiezen en vervolgens het bestand op uw harde schijf te selecteren.
          </div>
        </>
      );
    }
  };

  return (
    <>
      <span id="exportscreen"></span>
      <div className="modern-settings-container">
        <div className="modern-settings-header">
          <h1>📂 Bestand</h1>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Opslaglocatie kiezen */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ color: 'var(--primary-color)', fontSize: '20px', fontWeight: 600, margin: '0 0 8px' }}>
              Waar wilt u opslaan?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px', lineHeight: 1.5 }}>
              Kies apparaat of Google Drive. U kunt op elk moment wisselen.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {([
                { id: 'disk' as SaveDestination, icon: '💻', title: 'Dit apparaat', text: 'Open en bewaar bestanden op uw computer.' },
                { id: 'google-drive' as SaveDestination, icon: '☁️', title: 'Google Drive', text: 'Open en bewaar bestanden in uw Drive.' },
              ]).map((option) => {
                const selected = saveDestination === option.id;
                return (
                  <button
                    type="button"
                    key={option.id}
                    aria-pressed={selected}
                    onClick={() => setSaveDestination(option.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '16px',
                      borderRadius: '10px',
                      border: selected ? '2px solid var(--primary-color)' : '1px solid #d1d5db',
                      background: selected ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>{option.icon}</span>
                    <span>
                      <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '15px' }}>{option.title}</strong>
                      <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginTop: '3px' }}>{option.text}</span>
                    </span>
                    <span aria-hidden="true" style={{ marginLeft: 'auto', color: selected ? 'var(--primary-color)' : '#9ca3af', fontSize: '20px' }}>
                      {selected ? '●' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '18px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Bestandsformaat:{' '}
                <select
                  value={saveFormat}
                  onChange={(event) => setSaveFormat(event.target.value as 'eds' | 'json')}
                  style={{ marginLeft: '6px', padding: '7px 10px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white' }}
                >
                  <option value="eds">EDS (.eds)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-secondary)', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={disableCompression}
                  onChange={handleCompressionChange}
                  disabled={saveFormat === 'json'}
                />
                EDS zonder compressie
              </label>
            </div>
            {saveFormat === 'json' && (
              <p style={{ color: '#92400e', background: '#fef3c7', padding: '9px 12px', borderRadius: '6px', fontSize: '12px', margin: '12px 0 0' }}>
                JSON wordt niet ondersteund door oudere app-versies.
              </p>
            )}
          </div>

          {saveDestination === 'disk' && (
            <>
          {/* Openen Section */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                color: 'var(--primary-color)',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              📥 Openen uit bestand
            </h2>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
              <button
                onClick={handleLoad}
                style={{
                  background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                  color: 'white',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                📂 Openen
              </button>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                Click op "openen" en selecteer een eerder opgeslagen EDS of JSON bestand.
              </p>
            </div>
          </div>

          {/* Opslaan Section */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                color: 'var(--primary-color)',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              💾 Opslaan
            </h2>
            {renderSaveSection()}
          </div>
            </>
          )}

          {/* Google Drive Section */}
          {saveDestination === 'google-drive' && (
            <GoogleDrivePanel format={saveFormat} />
          )}

          {/* Samenvoegen Section */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <h2
              style={{
                color: 'var(--primary-color)',
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              🔀 Samenvoegen
            </h2>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'start' }}>
              <button
                onClick={handleMerge}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-color), var(--primary-color))',
                  color: 'white',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                🔀 Samenvoegen
              </button>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: '0 0 12px 0',
                  }}
                >
                  Open een tweede EDS bestand en voeg de inhoud toe aan het huidige EDS bestand.
                  Voegt de ééndraadschema's samen en voegt eveneens pagina's toe aan het
                  situatieschema als dat nodig is.
                </p>
                <div
                  style={{
                    background: '#fef2f2',
                    borderLeft: '4px solid #dc2626',
                    padding: '12px 16px',
                    borderRadius: '6px',
                  }}
                >
                  <strong style={{ color: '#991b1b' }}>⚠️ Opgelet!</strong>
                  <span style={{ color: '#991b1b' }}>
                    {' '}
                    Het is aanbevolen uw werk op te slaan alvorens deze functie te gebruiken!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilePage;
