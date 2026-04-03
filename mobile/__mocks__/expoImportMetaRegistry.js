// Mock de expo/src/winter/ImportMetaRegistry para el entorno Jest.
// El getter lazy en installGlobal.ts intenta require() este modulo en momentos
// donde el resolver de Jest ya no esta disponible (fuera de scope del test).
// En tests no necesitamos import.meta.url, asi que retornamos un objeto vacio.
module.exports = {
  ImportMetaRegistry: {
    get url() {
      return null;
    },
  },
};
