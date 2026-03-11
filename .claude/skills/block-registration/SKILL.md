# Block Registration Skill

## Purpose

This skill ensures that whenever you create a new block or modify an existing block, you ALWAYS update the three critical JSON files that control Universal Editor registration and functionality.

## Critical Rule: Always Update Three JSON Files

**Whenever you work on a new block or create a new block, you MUST update these three files:**

1. **component-definition.json** - Register the block definition (or update source files)
2. **component-filters.json** - Add block to section components and create filter if needed (or update source files)
3. **component-models.json** - Define the block's model with all fields (or update source files)

## Important: Source Files vs Generated Files

The component JSON files are **auto-generated** from source files. You must update the **source files**, then run `npm run build:json`:

### Source Files Structure:

1. **component-definition.json** is generated from:
   - `models/_component-definition.json` (base definitions)
   - `blocks/*/_*.json` (block definitions from `definitions` array)

2. **component-filters.json** is generated from:
   - `models/_section.json` (section components list - **CRITICAL**)
   - `blocks/*/_*.json` (filter definitions from `filters` array)

3. **component-models.json** is generated from:
   - `models/_component-models.json` (base models)
   - `blocks/*/_*.json` (model definitions from `models` array)

## Workflow Checklist

### When Creating a New Block:

1. ✅ Create block files:
   - `blocks/[block-name]/[block-name].js`
   - `blocks/[block-name]/[block-name].css`
   - `blocks/[block-name]/_[block-name].json`

2. ✅ Update `blocks/[block-name]/_[block-name].json`:
   - Add block definition in `definitions` array
   - Add model definition in `models` array (if using model pattern)
   - Add filter definition in `filters` array (if block has child components)

3. ✅ Update `models/_section.json`:
   - Add block ID to `"section"` components array (so it can be added to sections)
   - **THIS IS CRITICAL** - blocks won't appear in Universal Editor without this!

4. ✅ Run `npm run build:json`:
   - Regenerates `component-definition.json`
   - Regenerates `component-filters.json`
   - Regenerates `component-models.json`

5. ✅ Verify JSON validity:
   - Check for JSON syntax errors
   - Validate all references are correct
   - Test in Universal Editor

## Pattern Guidelines

### Use "model" for:
- Blocks with structured data fields
- Example: `"model": "teaser"`

### Use "filter" for:
- Blocks that contain child components
- Example: `"filter": "tabs"` (tabs contain tabs-item components)

### Use both "model" and "filter" for:
- Blocks that have both structured data AND child components
- Example: `"model": "tabs", "filter": "tabs"`

### Use "key-value": true for:
- Blocks that use key-value pair configuration
- Example: Teaser block

## Complete Example

### 1. Block JSON (`blocks/my-block/_my-block.json`):
```json
{
  "definitions": [
    {
      "title": "My Block",
      "id": "my-block",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "My Block",
              "model": "my-block"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "my-block",
      "fields": [
        {
          "component": "text",
          "name": "title",
          "label": "Title",
          "valueType": "string"
        }
      ]
    }
  ],
  "filters": []
}
```

### 2. Update `models/_section.json`:
Add to section components array:
```json
{
  "filters": [
    {
      "id": "section",
      "components": [
        ...existing components...,
        "my-block"
      ]
    }
  ]
}
```

### 3. Run build command:
```bash
npm run build:json
```

### 4. Verify:
- Check `component-definition.json` has the block definition
- Check `component-filters.json` has block in section components
- Check `component-models.json` has the model definition
- Test in Universal Editor

## Field Types Reference

- `"component": "text"` - Simple text input
- `"component": "richtext"` - Rich text editor
- `"component": "reference"` - Asset reference (images, etc.)
- `"component": "select"` - Dropdown with options
- `"component": "boolean"` - True/false checkbox
- `"component": "container"` - Grouped fields
- `"component": "aem-content"` - AEM content path picker
- `"component": "custom-asset-namespace:custom-asset"` - Custom asset picker (Dynamic Media)

## Common Mistakes to Avoid

❌ **Don't forget** to add block to `models/_section.json` section components
❌ **Don't forget** to create model in block's `_*.json` file
❌ **Don't forget** to add filter entry if block has child components
❌ **Don't forget** to run `npm run build:json` after changes
❌ **Don't forget** to validate JSON syntax
❌ **Don't edit** `component-*.json` files directly - they are auto-generated!

## Verification Steps

After making changes:

1. ✅ Run `npm run build:json` to regenerate merged files
2. ✅ Validate JSON: `node -e "JSON.parse(require('fs').readFileSync('component-definition.json', 'utf8'))"`
3. ✅ Check Universal Editor - block should appear in palette
4. ✅ Test block functionality - all fields should be editable
5. ✅ Verify no console errors

## Remember

**Every block MUST be registered in all three files (via source files) for it to work properly in Universal Editor!**

The most common mistake is forgetting to add the block ID to `models/_section.json` - this prevents the block from appearing in the Universal Editor component palette.
