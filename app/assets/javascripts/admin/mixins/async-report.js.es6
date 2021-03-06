import computed from "ember-addons/ember-computed-decorators";

export default Ember.Mixin.create({
  classNameBindings: ["isLoading", "dataSourceNames"],
  reports: null,
  isLoading: false,
  dataSourceNames: "",
  title: null,

  init() {
    this._super();
    this.set("reports", []);
  },

  @computed("dataSourceNames")
  dataSources(dataSourceNames) {
    return dataSourceNames.split(",").map(source => `/admin/reports/${source}`);
  },

  @computed("reports.[]", "startDate", "endDate", "dataSourceNames")
  reportsForPeriod(reports, startDate, endDate, dataSourceNames) {
    // on a slow network fetchReport could be called multiple times between
    // T and T+x, and all the ajax responses would occur after T+(x+y)
    // to avoid any inconsistencies we filter by period and make sure
    // the array contains only unique values
    reports = reports.uniqBy("report_key");

    const sort = (r) => {
      if (r.length > 1)  {
        return dataSourceNames
          .split(",")
          .map(name => r.findBy("type", name));
      } else {
        return r;
      }
    };

    if (!startDate || !endDate) {
      return sort(reports);
    }

    return sort(reports.filter(report => {
      return report.report_key.includes(startDate.format("YYYYMMDD")) &&
             report.report_key.includes(endDate.format("YYYYMMDD"));
    }));
  },

  didInsertElement() {
    this._super();

    this.fetchReport()
        .finally(() => {
          this.renderReport();
        });
  },

  didUpdateAttrs() {
    this._super();

    this.fetchReport()
        .finally(() => {
          this.renderReport();
        });
  },

  renderReport() {
    if (!this.element || this.isDestroying || this.isDestroyed) return;
    this.set("title", this.get("reportsForPeriod").map(r => r.title).join(", "));
    this.set("isLoading", false);
  },

  loadReport() {},

  fetchReport() {
    this.set("reports", []);
    this.set("isLoading", true);
  },
});
