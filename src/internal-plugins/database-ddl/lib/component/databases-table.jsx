const React = require('react');
const PropTypes = require('prop-types');
const { shell } = require('electron');
const ipc = require('hadron-ipc');
const { SortableTable } = require('hadron-react-components');
const numeral = require('numeral');
const { LOADING_STATE } = require('../constants');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:server-stats:databases');

/**
 * The help url linking to role-based authorization.
 */
const AUTH_HELP_URL = 'https://docs.mongodb.com/master/core/authorization/';

class DatabasesTable extends React.Component {

  constructor(props) {
    super(props);
    const appRegistry = global.hadronApp.appRegistry;
    this.DatabaseDDLAction = appRegistry.getAction('DatabaseDDL.Actions');
    this.CollectionStore = appRegistry.getStore('App.CollectionStore');
    this.TextWriteButton = appRegistry.getComponent('DeploymentAwareness.TextWriteButton');
    this.WriteStateStore = appRegistry.getStore('DeploymentAwareness.WriteStateStore');
    this.NamespaceStore = appRegistry.getStore('App.NamespaceStore');
    this.state = this.WriteStateStore.state;
  }

  componentDidMount() {
    this.unsubscribeStateStore = this.WriteStateStore.listen(this.deploymentStateChanged.bind(this));
  }

  componentWillUnmount() {
    this.unsubscribeStateStore();
  }

  onColumnHeaderClicked(column, order) {
    this.DatabaseDDLAction.sortDatabases(column, order);
  }

  onRowDeleteButtonClicked(index, dbName) {
    this.DatabaseDDLAction.openDropDatabaseDialog(dbName);
  }

  onCreateDatabaseButtonClicked() {
    this.DatabaseDDLAction.openCreateDatabaseDialog();
  }

  onAuthHelpClicked(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    shell.openExternal(AUTH_HELP_URL);
  }

  onNameClicked(name) {
    if (this.NamespaceStore.ns !== name) {
      this.CollectionStore.setCollection({});
      this.NamespaceStore.ns = name;
      ipc.call('window:hide-collection-submenu');
    }
  }

  onClickShowConnectWindow() {
    // code to close current connection window and open connect dialog
    ipc.call('app:show-connect-window');
    window.close();
  }

  /**
   * Called when the deployment state changes.
   *
   * @param {Object} state - The deployment state.
   */
  deploymentStateChanged(state) {
    this.setState(state);
  }

  isReadonlyDistro() {
    return process.env.HADRON_READONLY === 'true';
  }

  renderNoCollections(isWritable) {
    return (
      <div className="no-collections-zero-state">
        The MongoDB instance you are connected to
        does not contain any collections, or you are
        <a onClick={this.onAuthHelpClicked.bind(this)}>not authorized</a>
        to view them.
        {!isWritable ?
          <a className="show-connect-window"
             onClick={this.onClickShowConnectWindow.bind(this)}
          >Connect to another instance</a>
          : null}
      </div>
    );
  }

  renderCreateDatabaseButton() {
    if (!this.isReadonlyDistro()) {
      return (
        <this.TextWriteButton
          className="btn btn-primary btn-xs"
          dataTestId="open-create-database-modal-button"
          text="Create Database"
          tooltipId="database-ddl-is-not-writable"
          clickHandler={this.onCreateDatabaseButtonClicked.bind(this)} />
      );
    }
  }

  render() {
    if (this.props.databases === LOADING_STATE) {
      // Handled by the <Status> component
      return null;
    }

    // convert storage size to human-readable units (MB, GB, ...)
    // we do this here so that sorting is not affected in the store
    const rows = _.map(this.props.databases, (db) => {
      const dbName = db['Database Name'];
      return _.assign({}, db, {
        'Database Name': <a className="rtss-databases-link" href="#" onClick={this.onNameClicked.bind(this, dbName)}>{dbName}</a>,
        'Storage Size': numeral(db['Storage Size']).format('0.0b')
      });
    });

    return (
      <div className="rtss-databases" data-test-id="databases-table">
        <div className="rtss-databases-create-button action-bar controls-container">
          {this.renderCreateDatabaseButton()}
        </div>
        <div className="column-container">
          <div className="column main">
            <SortableTable
              theme="light"
              columns={this.props.columns}
              rows={rows}
              sortable
              sortOrder={this.props.sortOrder}
              sortColumn={this.props.sortColumn}
              valueIndex={0}
              removable={this.state.isWritable && !this.isReadonlyDistro()}
              onColumnHeaderClicked={this.onColumnHeaderClicked.bind(this)}
              onRowDeleteButtonClicked={this.onRowDeleteButtonClicked.bind(this)}
            />
          </div>
        </div>
        {this.props.databases.length === 0 ?
           this.renderNoCollections(this.state.isWritable) : null}
      </div>
    );
  }
}

DatabasesTable.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string),
  databases: PropTypes.arrayOf(PropTypes.object),
  sortOrder: PropTypes.oneOf(['asc', 'desc']),
  sortColumn: PropTypes.string
};

DatabasesTable.displayName = 'DatabasesTable';

module.exports = DatabasesTable;
