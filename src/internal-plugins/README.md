# Compass Internal Plugins

## Developer Notes

When registering resources in the app registry, please use the `PluginName.ResourceName`
convention for keys.

### Examples:

The `DocumentList` component in the `CRUD` package:

```javascript
app.appRegistry.registerComponent('CRUD.DocumentList');
```

All the actions in the `indexes` pacakge:

```javascript
app.appRegistry.registerAction('Indexes.Actions');
```
