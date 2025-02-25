import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import "./App.css";

const codigoSelectStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "white"
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "white"
  }),
  option: (provided, state) => ({
    ...provided,
    color: state.isSelected ? "white" : "black",
    backgroundColor: state.isSelected ? "#007bff" : state.isFocused ? "#f0f0f0" : "white"
  })
};

const API_BASE = "";
const GRID_COLUMNS = [
  "CÓDIGO DEPENDENCIA (ESPECIALIDAD)",
  "FECHA ANTENCION",
  "CEDULA",
  "NOMBRE DE BENEFICIARIO",
  "CODIGO",
  "DESCRIPCIÓN",
  "OBSERVACIONES",
  "DIAGNOSTICO PRINCIPAL CIE-10",
  "CANTIDAD",
  "DIAGNOSTICO PRESUNTIVO O DIFINITIVO",
  "OBSERVACIONES"
];

const blankRow = { name: "", code: "", quantity: 0 };

function App() {
  const [gridData, setGridData] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [paciente, setPaciente] = useState(null);
  const [diagnostico, setDiagnostico] = useState({ nameSelect: null, codeSelect: null });
  const [procedimientos, setProcedimientos] = useState([{ ...blankRow }]);
  const [medicamentos, setMedicamentos] = useState([{ ...blankRow }]);
  const [insumos, setInsumos] = useState([{ ...blankRow }]);
  const [patientsMaster, setPatientsMaster] = useState([]);
  const [diagnosticsMaster, setDiagnosticsMaster] = useState([]);
  const [proceduresMaster, setProceduresMaster] = useState([]);
  const [medicationsMaster, setMedicationsMaster] = useState([]);
  const [formKey, setFormKey] = useState(Date.now());
  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    // Fetch patients
    axios.get(`${API_BASE}/patients/full/`)
      .then(res => {
        setPatientsMaster(res.data.map(p => ({ value: p, label: p })));
      });

    // Fetch diagnostics
    axios.get(`${API_BASE}/diagnostics/full/`)
      .then(res => {
        setDiagnosticsMaster(res.data.map(item => ({
          value: item.NOMBRE,
          label: item.NOMBRE,
          code: item["CÓDIGO"]
        })));
      });

    // Fetch procedures with codes
    axios.get(`${API_BASE}/procedures/full/`)
      .then(res => {
        setProceduresMaster(res.data.map(item => ({
          value: item.DESCRIPCIÓN,
          label: `${item.CODIGO ? String(item.CODIGO) : String(item["CÓDIGO"])} - ${item.DESCRIPCIÓN}`,
          code: item.CODIGO ? String(item.CODIGO) : String(item["CÓDIGO"])
        })));
      });

    // Fetch medications with codes
    axios.get(`${API_BASE}/medications/full/`)
      .then(res => {
        setMedicationsMaster(res.data.map(item => ({
          value: item.DESCRIPCIÓN,
          label: `${item.CODIGO ? String(item.CODIGO) : String(item["CÓDIGO"])} - ${item.DESCRIPCIÓN}`,
          code: item.CODIGO ? String(item.CODIGO) : String(item["CÓDIGO"])
        })));
      });

    fetchGridData();
  }, []);

  // Handlers for procedures and medications with forced string conversion
  const handleProcSelect = (index, selectedOption) => {
    setProcedimientos(prev => {
      const newRows = [...prev];
      newRows[index] = {
        name: selectedOption?.value || "",
        code: selectedOption?.code ? String(selectedOption.code) : "",
        quantity: newRows[index].quantity
      };
      if (index === newRows.length - 1 && selectedOption) {
        newRows.push({ ...blankRow });
      }
      return newRows;
    });
  };

  const handleMedSelect = (index, selectedOption) => {
    setMedicamentos(prev => {
      const newRows = [...prev];
      newRows[index] = {
        name: selectedOption?.value || "",
        code: selectedOption?.code ? String(selectedOption.code) : "",
        quantity: newRows[index].quantity
      };
      if (index === newRows.length - 1 && selectedOption) {
        newRows.push({ ...blankRow });
      }
      return newRows;
    });
  };

  const handleQuantityChange = (setter, index, value) => {
    setter(prev => {
      const newRows = [...prev];
      newRows[index].quantity = Number(value) || 0;
      return newRows;
    });
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    const formData = new FormData();
    formData.append("file", selectedFile);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setStatus(res.data.message);
      fetchGridData();
    } catch (error) {
      console.error(error);
      setStatus("Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  const fetchGridData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/data/`);
      setGridData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInsumoChange = (index, field, value) => {
    setInsumos(prev => {
      const newRows = [...prev];
      newRows[index] = {
        ...newRows[index],
        [field]: value
      };
      if (index === newRows.length - 1 && value) {
        newRows.push({ ...blankRow });
      }
      return newRows;
    });
  };

  const handlePacienteSelect = (selectedOption) => {
    setPaciente(selectedOption);
  };

  const handleDiagnosticoNameSelect = (selectedOption) => {
    setDiagnostico(prev => ({
      ...prev,
      nameSelect: selectedOption,
      codeSelect: selectedOption ? { value: selectedOption.code, label: selectedOption.code } : null
    }));
  };

  const handleDiagnosticoCodeSelect = (selectedOption) => {
    const option = diagnosticsMaster.find(opt => String(opt.code) === String(selectedOption ? selectedOption.value : ""));
    setDiagnostico(prev => ({
      ...prev,
      codeSelect: selectedOption,
      nameSelect: option ? { value: option.value, label: option.value, code: option.code } : prev.nameSelect
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      paciente: paciente ? paciente.value : "",
      diagnostico_name: diagnostico.nameSelect ? diagnostico.nameSelect.value : "",
      diagnostico_code: diagnostico.codeSelect ? diagnostico.codeSelect.value : "",
      procedimientos: procedimientos.filter(row => row.name),
      medicamentos: medicamentos.filter(row => row.name),
      insumos: insumos.filter(row => row.name)
    };
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/add/`, payload);
      setStatus(res.data.message);
      fetchGridData();
      handleClear();
    } catch (error) {
      console.error(error);
      setStatus("Error adding entry");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRows = async () => {
    try {
      await axios.post(`${API_BASE}/delete/`, { ids: selectedRows });
      setStatus("Filas eliminadas exitosamente.");
      setSelectedRows([]);
      fetchGridData();
    } catch (error) {
      console.error(error);
      setStatus("Error eliminando filas");
    }
  };

  const handleRowSelect = (id, checked) => {
    setSelectedRows(prev => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter(x => x !== id);
      }
    });
  };

  const handleRowClick = (row) => {
    setPaciente({ value: row["NOMBRE DE BENEFICIARIO"], label: row["NOMBRE DE BENEFICIARIO"] });
    if (row["DIAGNOSTICO PRINCIPAL CIE-10"]) {
      axios.get(`${API_BASE}/sync/diagnostic/?code=${row["DIAGNOSTICO PRINCIPAL CIE-10"]}`)
        .then((res) => setDiagnostico({
          nameSelect: { value: res.data.name, label: res.data.name, code: res.data.code },
          codeSelect: { value: res.data.code, label: res.data.code, code: res.data.code }
        }))
        .catch((err) => console.error(err));
    }
  };

  const handleClear = () => {
    setPaciente(null);
    setDiagnostico({ nameSelect: null, codeSelect: null });
    setProcedimientos([{ ...blankRow }]);
    setMedicamentos([{ ...blankRow }]);
    setInsumos([{ ...blankRow }]);
    setFormKey(Date.now());
  };

  return (
    <div className="app-container">
      <div className="form-container">
        <h1>Registro de Servicios</h1>
        {loading && <div className="spinner"></div>}
        <div className="upload-section">
          <label htmlFor="fileUpload">Seleccionar Archivo Main:</label>
          <input type="file" id="fileUpload" accept=".xlsx,.csv" onChange={handleFileUpload} />
        </div>
        <form key={formKey} onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Paciente:</label>
            <Select
              options={patientsMaster}
              value={paciente}
              onChange={handlePacienteSelect}
              placeholder="Seleccione paciente"
              isClearable
            />
          </div>
          <div className="form-group diagnostico-group">
            <label>Diagnóstico:</label>
            <div className="diagnostico-fields">
              <Select
                options={diagnosticsMaster}
                value={diagnostico.nameSelect}
                onChange={handleDiagnosticoNameSelect}
                placeholder="Nombre diagnóstico"
                isClearable
              />
              <Select
                options={diagnosticsMaster.map(opt => ({
                  value: opt.code,
                  label: opt.code,
                  code: opt.code
                }))}
                value={diagnostico.codeSelect}
                onChange={handleDiagnosticoCodeSelect}
                placeholder="Código diagnóstico"
                isClearable
                styles={codigoSelectStyles}
              />
            </div>
          </div>
          <fieldset className="fieldset-group">
            <legend>Procedimientos</legend>
            {procedimientos.map((item, i) => (
              <div key={`proc-${i}`} className="row-group">
                <Select
                  options={proceduresMaster}
                  value={proceduresMaster.find(opt => 
                    opt.value === item.name && opt.code === item.code
                  )}
                  onChange={(selected) => handleProcSelect(i, selected)}
                  placeholder="Seleccionar procedimiento"
                  isClearable
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(setProcedimientos, i, e.target.value)}
                  placeholder="Cantidad"
                  min="0"
                />
              </div>
            ))}
          </fieldset>
          <fieldset className="fieldset-group">
            <legend>Medicamentos</legend>
            {medicamentos.map((item, i) => (
              <div key={`med-${i}`} className="row-group">
                <Select
                  options={medicationsMaster}
                  value={medicationsMaster.find(opt => 
                    opt.value === item.name && opt.code === item.code
                  )}
                  onChange={(selected) => handleMedSelect(i, selected)}
                  placeholder="Seleccionar medicamento"
                  isClearable
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(setMedicamentos, i, e.target.value)}
                  placeholder="Cantidad"
                  min="0"
                />
              </div>
            ))}
          </fieldset>
          <fieldset className="fieldset-group">
            <legend>Insumos</legend>
            {insumos.map((item, i) => (
              <div key={`insumo-${i}`} className="row-group">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleInsumoChange(i, "name", e.target.value)}
                  placeholder="Nombre"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleInsumoChange(i, "quantity", parseInt(e.target.value) || 0)}
                  placeholder="Cantidad"
                  min="0"
                />
              </div>
            ))}
          </fieldset>
          <div className="button-group">
            <button type="submit" className="btn-submit">Agregar Entrada</button>
            <button type="button" onClick={handleClear} className="btn-clear">Limpiar Todo</button>
          </div>
        </form>
        <div className="download-group">
          <button onClick={handleDownload} className="btn-download">Descargar Archivo</button>
        </div>
        {status && <p className="status">{status}</p>}
      </div>
      <div className="grid-container">
        <h2>Datos Cargados</h2>
        {selectedRows.length > 0 && (
          <button onClick={handleDeleteRows} className="btn-delete">Eliminar Filas</button>
        )}
        <table className="grid-table">
          <thead>
            <tr>
              <th>Seleccionar</th>
              {GRID_COLUMNS.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.map((row) => (
              <tr key={row.id} onClick={() => handleRowClick(row)}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                  />
                </td>
                {GRID_COLUMNS.map((col) => (
                  <td key={col}>{row[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
