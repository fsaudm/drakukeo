import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import "./App.css";

// Force wide dropdowns
const wideSelectStyles = {
  container: (provided) => ({ ...provided, width: "400px" }),
  menu: (provided) => ({ ...provided, width: "400px" })
};

const API_BASE = "";
const GRID_COLUMNS = [
  "FECHA DE INGRESO",
  "FECHA DE EGRESO",
  "CÓDIGO DEPENDENCIA (ESPECIALIDAD)",
  "FECHA ANTENCION",
  "CEDULA",
  "NOMBRE DE BENEFICIARIO",
  "CODIGO",
  "DESCRIPCIÓN",
  "DIAGNOSTICO PRINCIPAL CIE-10",
  "DIAGNSITICO SECUNDARIO 1",
  "CANTIDAD",
  "DIAGNOSTICO PRESUNTIVO O DIFINITIVO",
  "OBSERVACIONES"
];

const blankRow = { name: "", code: "", quantity: 0 };

function App() {
  const [gridData, setGridData] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  // Main form fields
  const [paciente, setPaciente] = useState(null);
  const [diagnostico, setDiagnostico] = useState({ nameSelect: null, codeSelect: null });
  const [diagnosticoSecundario, setDiagnosticoSecundario] = useState({ nameSelect: null, codeSelect: null });
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [fechaEgreso, setFechaEgreso] = useState("");

  // Dynamic rows for procedures, medications, and insumos
  const [procedimientos, setProcedimientos] = useState([{ ...blankRow }]);
  const [medicamentos, setMedicamentos] = useState([{ ...blankRow }]);
  const [insumos, setInsumos] = useState([{ ...blankRow }]);

  // Master lists for small sets
  const [patientsMaster, setPatientsMaster] = useState([]);
  const [medicationsMaster, setMedicationsMaster] = useState([]);

  // For multi-row selection in grid
  const [selectedRows, setSelectedRows] = useState([]);
  const [formKey, setFormKey] = useState(Date.now());

  useEffect(() => {
    axios.get(`${API_BASE}/patients/full/`)
      .then(res => setPatientsMaster(res.data.map(p => ({ value: p, label: p }))));
    axios.get(`${API_BASE}/medications/full/`)
      .then(res => {
        const meds = res.data.map(item => ({
          value: item.concat,
          label: item.concat,
          code: item.CODIGO ? item.CODIGO.toString() : ""
        }));
        setMedicationsMaster(meds);
      });
    fetchGridData();
  }, []);

  const fetchGridData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/data/`);
      setGridData(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // File upload handler
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

  // Async load for Diagnóstico (by name)
  const loadDiagnosticNameOptions = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    axios.get(`${API_BASE}/search/diagnostics/?query=${encodeURIComponent(inputValue)}`)
      .then(res => {
        const options = res.data.map(item => ({
          label: item.NOMBRE,
          value: item.CÓDIGO, // using code as value
          code: item.CÓDIGO
        }));
        callback(options);
      })
      .catch(() => callback([]));
  };

  // Async load for Diagnóstico (by code)
  const loadDiagnosticCodeOptions = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    axios.get(`${API_BASE}/search/diagnostics/code/?query=${encodeURIComponent(inputValue)}`)
      .then(res => {
        const options = res.data.map(item => ({
          label: item.CÓDIGO,
          value: item.CÓDIGO,
          name: item.NOMBRE
        }));
        callback(options);
      })
      .catch(() => callback([]));
  };

  const loadProcedureOptions = (inputValue, callback) => {
    if (!inputValue) return callback([]);
    axios.get(`${API_BASE}/search/procedures/?query=${encodeURIComponent(inputValue)}`)
      .then(res => {
        const options = res.data.map(it => ({
          label: `${it.CÓDIGO} - ${it.DESCRIPCIÓN}`,
          value: it.DESCRIPCIÓN,
          code: it.CÓDIGO
        }));
        callback(options);
      })
      .catch(() => callback([]));
  };

  // Dynamic rows: Procedimientos
  const handleProcSelect = (index, selectedOption) => {
    setProcedimientos(prev => {
      const newRows = [...prev];
      newRows[index] = {
        name: selectedOption?.value || "",
        code: selectedOption?.code || "",
        quantity: newRows[index].quantity
      };
      if (index === newRows.length - 1 && selectedOption)
        newRows.push({ ...blankRow });
      return newRows;
    });
  };

  // Dynamic rows: Medicamentos
  const handleMedSelect = (index, selectedOption) => {
    setMedicamentos(prev => {
      const newRows = [...prev];
      newRows[index] = {
        // Ensure code is converted to string
        name: selectedOption?.value || "",
        code: selectedOption?.code ? selectedOption.code.toString() : "",
        quantity: newRows[index].quantity
      };
      if (index === newRows.length - 1 && selectedOption)
        newRows.push({ ...blankRow });
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

  const handleInsumoChange = (index, field, value) => {
    setInsumos(prev => {
      const newRows = [...prev];
      newRows[index] = { ...newRows[index], [field]: value };
      if (index === newRows.length - 1 && value)
        newRows.push({ ...blankRow });
      return newRows;
    });
  };

  // Handlers for Paciente and Diagnósticos
  const handlePacienteSelect = (selectedOption) => {
    setPaciente(selectedOption);
  };

  const handleDiagnosticoNameSelect = (selectedOption) => {
    setDiagnostico(prev => ({
      ...prev,
      nameSelect: selectedOption,
      codeSelect: selectedOption
        ? { value: selectedOption.code.toString(), label: selectedOption.code.toString(), code: selectedOption.code.toString() }
        : null
    }));
  };

  const handleDiagnosticoCodeSelect = (selectedOption) => {
    setDiagnostico(prev => ({
      ...prev,
      codeSelect: selectedOption,
      nameSelect: selectedOption
        ? { value: selectedOption.value, label: selectedOption.name, code: selectedOption.value }
        : null
    }));
  };

  const handleDiagnosticoSecNameSelect = (selectedOption) => {
    setDiagnosticoSecundario(prev => ({
      ...prev,
      nameSelect: selectedOption,
      codeSelect: selectedOption
        ? { value: selectedOption.code.toString(), label: selectedOption.code.toString(), code: selectedOption.code.toString() }
        : null
    }));
  };

  const handleDiagnosticoSecCodeSelect = (selectedOption) => {
    setDiagnosticoSecundario(prev => ({
      ...prev,
      codeSelect: selectedOption,
      nameSelect: selectedOption
        ? { value: selectedOption.value, label: selectedOption.name, code: selectedOption.value }
        : null
    }));
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      paciente: paciente?.value || "",
      diagnostico_name: diagnostico.nameSelect?.label || "",
      diagnostico_code: diagnostico.nameSelect?.value || "",
      diagnostico_secundario_name: diagnosticoSecundario.nameSelect?.label || "",
      diagnostico_secundario_code: diagnosticoSecundario.nameSelect?.value || "",
      fecha_ingreso: fechaIngreso,
      fecha_egreso: fechaEgreso,
      procedimientos: procedimientos.filter(r => r.name),
      medicamentos: medicamentos.filter(r => r.name),
      insumos: insumos.filter(r => r.name)
    };
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

  const handleDownload = async () => {
    try {
      const res = await axios.get(`${API_BASE}/download/`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "data.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error(error);
      setStatus("Error downloading file");
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
    setSelectedRows(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)));
  };

  const handleRowClick = (row) => {
    setPaciente({ value: row["NOMBRE DE BENEFICIARIO"], label: row["NOMBRE DE BENEFICIARIO"] });
    if (row["DIAGNOSTICO PRINCIPAL CIE-10"]) {
      axios.get(`${API_BASE}/sync/diagnostic/?code=${row["DIAGNOSTICO PRINCIPAL CIE-10"]}`)
        .then(res => {
          setDiagnostico({
            nameSelect: { label: res.data.name, value: res.data.code, code: res.data.code },
            codeSelect: { label: res.data.code, value: res.data.code, code: res.data.code }
          });
        })
        .catch(err => console.error(err));
    }
    if (row["DIAGNSITICO SECUNDARIO 1"]) {
      axios.get(`${API_BASE}/sync/diagnostic/?code=${row["DIAGNSITICO SECUNDARIO 1"]}`)
        .then(res => {
          setDiagnosticoSecundario({
            nameSelect: { label: res.data.name, value: res.data.code, code: res.data.code },
            codeSelect: { label: res.data.code, value: res.data.code, code: res.data.code }
          });
        })
        .catch(err => console.error(err));
    }
    setFechaIngreso(row["FECHA DE INGRESO"] || "");
    setFechaEgreso(row["FECHA DE EGRESO"] || "");
  };

  const handleClear = () => {
    setPaciente(null);
    setDiagnostico({ nameSelect: null, codeSelect: null });
    setDiagnosticoSecundario({ nameSelect: null, codeSelect: null });
    setFechaIngreso("");
    setFechaEgreso("");
    setProcedimientos([{ ...blankRow }]);
    setMedicamentos([{ ...blankRow }]);
    setInsumos([{ ...blankRow }]);
    setSelectedRows([]);
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
          {/* Paciente */}
          <div className="form-group">
            <label>Paciente:</label>
            <Select
              options={patientsMaster}
              value={paciente}
              onChange={handlePacienteSelect}
              placeholder="Seleccione paciente"
              isClearable
              styles={wideSelectStyles}
            />
          </div>
          {/* Diagnóstico Principal */}
          <div className="form-group diagnostico-group">
            <label>Diagnóstico Principal:</label>
            <div className="diagnostico-fields">
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadDiagnosticNameOptions}
                value={diagnostico.nameSelect}
                onChange={handleDiagnosticoNameSelect}
                placeholder="Buscar diagnóstico principal..."
                styles={wideSelectStyles}
              />
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadDiagnosticCodeOptions}
                value={diagnostico.codeSelect}
                onChange={handleDiagnosticoCodeSelect}
                placeholder="Código diagnóstico principal"
                styles={wideSelectStyles}
              />
            </div>
          </div>
          {/* Diagnóstico Secundario */}
          <div className="form-group diagnostico-group">
            <label>Diagnóstico Secundario:</label>
            <div className="diagnostico-fields">
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadDiagnosticNameOptions}
                value={diagnosticoSecundario.nameSelect}
                onChange={handleDiagnosticoSecNameSelect}
                placeholder="Buscar diagnóstico secundario..."
                styles={wideSelectStyles}
              />
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadDiagnosticCodeOptions}
                value={diagnosticoSecundario.codeSelect}
                onChange={handleDiagnosticoSecCodeSelect}
                placeholder="Código diagnóstico secundario"
                styles={wideSelectStyles}
              />
            </div>
          </div>
          {/* Fechas */}
          <div className="form-group">
            <label>Fecha de Ingreso:</label>
            <input
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Fecha de Egreso:</label>
            <input
              type="date"
              value={fechaEgreso}
              onChange={(e) => setFechaEgreso(e.target.value)}
            />
          </div>
          {/* Procedimientos */}
          <fieldset className="fieldset-group">
            <legend>Procedimientos</legend>
            {procedimientos.map((item, i) => (
              <div key={`proc-${i}`} className="row-group">
                <AsyncSelect
                  cacheOptions
                  defaultOptions
                  loadOptions={loadProcedureOptions}
                  value={item.name ? { value: item.name, label: item.name, code: item.code } : null}
                  onChange={(selected) => handleProcSelect(i, selected)}
                  placeholder="Buscar procedimiento..."
                  isClearable
                  styles={wideSelectStyles}
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
          {/* Medicamentos */}
          <fieldset className="fieldset-group">
            <legend>Medicamentos</legend>
            {medicamentos.map((item, i) => (
              <div key={`med-${i}`} className="row-group">
                <Select
                  options={medicationsMaster}
                  value={
                    item.name
                      ? { value: item.name, label: item.name, code: item.code ? item.code.toString() : "" }
                      : null
                  }
                  onChange={(selected) => handleMedSelect(i, selected)}
                  placeholder="Seleccionar medicamento"
                  isClearable
                  styles={wideSelectStyles}
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
          {/* Insumos */}
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
          {/* Submit & Clear */}
          <div className="button-group">
            <button type="submit" className="btn-submit">Agregar Entrada</button>
            <button type="button" onClick={handleClear} className="btn-clear">Limpiar Todo</button>
          </div>
        </form>
        {/* Download */}
        <div className="download-group">
          <button onClick={handleDownload} className="btn-download">Descargar Archivo</button>
        </div>
        {status && <p className="status">{status}</p>}
      </div>
      {/* Grid View */}
      <div className="grid-container">
        <h2>Datos Cargados</h2>
        {selectedRows.length > 0 && (
          <button onClick={handleDeleteRows} className="btn-delete">Eliminar Filas</button>
        )}
        <table className="grid-table">
          <thead>
            <tr>
              <th>Seleccionar</th>
              {GRID_COLUMNS.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.map(row => (
              <tr key={row.id} onClick={() => handleRowClick(row)}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(row.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                  />
                </td>
                {GRID_COLUMNS.map(col => (
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
