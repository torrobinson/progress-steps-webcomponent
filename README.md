# progress-steps-webcomponent

A web component for displaying the steps of a process and letting users move between them

<img src="/docs/sample.png">
	
## 👉[View Example](https://torrobinson.github.io/progress-steps-webcomponent/docs/)👈

## Getting Started

### CDN

Use the built file from npm from https://unpkg.com/progress-steps-webcomponent@latest

```html
<!-- For example -->
<script src="https://unpkg.com/progress-steps-webcomponent@latest"></script>
```

### Manual

To build yourself, clone the repo, and run

```node
npm i
npm run build
```

And use the `dist/progress-steps.min.js` file

## Configuration

View the example above for a complete working example.
Add the component anywhere in your html:

```html
<progress-steps id="my-steps"></progress-steps>
```

Then initialize the control

```js
// Find the control
let myStepper = document.querySelector('#my-steps');

// And initialize it
myStepper.init({
	steps: [{ name: 'Step 1' }, { name: 'Step 2' }, { name: 'Step 3' }],
});
```

### Step configuration

You can disable steps by setting `disabled` to `true`.
You can attach any custom property to a step that you wish. When programmatically fetching the step later, those values can be retrieved and used. For example, you might attach custom IDs/GUIDs to them, so that when a step is changed, you can act upon the ID of that step:

```js
myStepper.init({
	steps: [
		{ name: 'Step 1', myCustomId: 1 },
		{ name: 'Step 2', myCustomId: 2 },
		{ name: 'Step 3', myCustomId: 3 },
		{ name: 'Step 4', myCustomId: 4 },
		{ name: 'Step 5', myCustomId: 5, disabled: true },
		{ name: 'Step 6', myCustomId: 6, disabled: true },
	],
	events: {
		onStepChanged: function (stepNumber, stepObj) {
			console.log(`Step changed to ${stepNumber}!`);
			let newId = stepObj.myCustomId;
			// [Act upon newId here]
		},
	},
});
```

### Events

| Event Name    | Parameters            | Description                    |
| ------------- | --------------------- | ------------------------------ |
| onStepChanged | (stepNumber, stepObj) | Fired when the step is changed |

### Methods

| Method Name | Parameters | Description                                                     |
| ----------- | ---------- | --------------------------------------------------------------- |
| init        | (options)  | Initializes the control. See above examples for `options` usage |
| getStep     |            | Returns the step object of the current active step              |
| setStep     | (step)     | Takes in the step number of the step to change to               |
| stepUp      |            | Increments the current active step                              |
| stepDown    |            | Decrements the current active step                              |
| disableStep | (step)     | Takes in the step number of a step and disables it from use     |
| enableStep  | (step)     | Takes in the step number of a step and enables it for use       |

### Styling

Styling can be overridden by passing in CSS values to the `style` object. All options are entirely optional.
The most commonly overridden value would be that of the color that the bar fills up with, `progressFillColor`

```js
myStepper.init({
	steps: [
		...
	],
	style: {
		// The width of each step icon
		stepWidth: 20,
		// The font size of the step number and label
		fontSize: 12,
		// The border radius of the step icon
		borderRadius: '25%',
		// The thickness of the line/progress bar/borders
		lineThickness: 2,
		// The animation speed of the progress bar filling up
		animationSpeed: '500ms',
		// Whether or not to show labels or not
		showLabels: true,
		// The vertical margin of the labels, if shown
		labelSpacing: 5,
		// The font weight to use on step labels
		stepLabelFontWeight: 'normal',
		// The font color of step labels that are before the current step
		previousLabelFontColor: 'red',
		// The font color of the current step label
		currentLabelFontColor: 'blue',
		// The font weight of the current step label
		currentStepLabelFontWeight: 'bold',
		// The font color of step labels that are after the current step
		futureLabelFontColor: 'green',
		// The font color of step labels that are disabled
		disabledLabelFontColor: 'maroon',
		// The color to fill up, left-to-right, as steps are set to active
		progressFillColor: '#cf78d9',
		// The default color of the unfilled section of line and steps after the active step
		progressUnfilledColor: '#d5dce2',
		// The font color of the step icon that is currently active
		currentStepFontColor: 'white',
		// The fill-color for step icons that are after the current active step
		futureStepFillColor: 'orange',
		// The font color of the disabled steps
		disabledStepFontColor: 'red',
		// The fill-color for disabled step icons
		disabledStepFillColor: 'blue'
	},
});
```
