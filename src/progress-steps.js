var deepExtend = function (out) {
	out = out || {};

	for (var i = 1; i < arguments.length; i++) {
		var obj = arguments[i];

		if (!obj) continue;

		for (var key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (typeof obj[key] === 'object') {
					if (obj[key] instanceof Array == true)
						out[key] = obj[key].slice(0);
					else out[key] = deepExtend(out[key], obj[key]);
				} else out[key] = obj[key];
			}
		}
	}

	return out;
};

function stringToHTML(str) {
	var div = document.createElement('div');
	div.innerHTML = str.trim();
	return div.firstChild;
}

class ProgressSteps extends HTMLElement {
	constructor() {
		// Super
		super();

		// Instance variables
		this._defaultOptions = null;
		this._options = null;
		this._container = null;

		// Instance state
		this._stepNumber = -1;

		// Create shadow DOM and get back the root div container
		this._shadowRoot = this.attachShadow({ mode: 'open' });
		this._shadowRoot.append(
			stringToHTML(`
    	<style>
            .progress-steps {
                display: flex;
                margin: 0 auto;
                position: relative;
                transition: width var(--animation-speed);
                justify-content: space-between;

                /* Dynamically set our width via the 2 'known' attributes updated on resizes and render */
                width: calc(100% - (var(--known-available-width) / (var(--known-step-count) - 1)) * 1px);  
            }

            /* The underlying grey line*/
            .progress-steps::before {
                content: '';
                z-index: 1;
                display: block;
                position: absolute;
                width: calc(100% - var(--step-width));
                left: calc(var(--step-width)/2);
                height: 0px;
                top: calc( (var(--step-width)/2) - (var(--line-thickness)/2) );
                border: none;
                border-bottom: var(--line-thickness) solid var(--unfilled-color);
            }

            /* The overlapping colored value line*/
            .progress-steps .completion-bar {
                content: '';
                z-index: 2;
                display: block;
                position: absolute;
                width: 0%;
                transition: width var(--animation-speed);
                height: 0px;
                top: calc( (var(--step-width)/2) - (var(--line-thickness)/2) );
                left: calc(var(--step-width)/2);
                border: none;
                border-bottom: var(--line-thickness) solid var(--fill-color);
            }

            /* The colored balls */
            .progress-steps .progress-step::before {
                content: attr(data-step-number);
                z-index: 3;
                width: calc(var(--step-width) - var(--line-thickness)*2);
                height: calc(var(--step-width) - var(--line-thickness)*2);
                background-color: var(--future-step-fill-color);
                border: var(--line-thickness) solid var(--unfilled-color);
                color: var(--unfilled-color);
                border-radius: var(--step-border-radius);
                position: relative;
                transition: background-color var(--animation-speed);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: var(--step-title-font);
            }

            .progress-steps .progress-step.previous::before, .progress-steps .progress-step.current::before{
                color: var(--current-step-font-color);
                background-color: var(--fill-color);
                border: none;
                width: var(--step-width);
                height: var(--step-width);
            }
            

            .progress-steps .progress-step.current .progress-title {
                color: var(--current-label-font-color) !important;
                font-weight: var(--current-label-font-weight);
                font-weight: var(--current-label-font-weight) !important;
            }
            .progress-steps .progress-step.current::before {
                background-color: var(--fill-color);
                box-shadow: var(--current-step-shadow);
            }


            .progress-steps .progress-step.disabled::before {
                background-color: var(--disabled-step-fill-color);
                border-color: var(--unfilled-color);
                color: var(--disabled-step-font-color);
            }

            .progress-steps .progress-step.disabled {
                cursor: not-allowed;
            }

            .progress-steps .progress-step:not(.disabled) {
                cursor: pointer;
            }

            .progress-steps .progress-step {
                justify-content: space-evenly;
                font-size: var(--font-size);
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            .progress-steps .progress-step.future .progress-title{
                color: var(--future-label-font-color);
            }
            
            .progress-steps .progress-step.disabled .progress-title{
                color: var(--disabled-label-font-color);
            }

            .progress-steps .progress-step .progress-title {
                z-index: 3;
                display: var(--step-label-display);
                position: absolute;
                text-align: center;
                top: calc( var(--step-width) + var(--step-label-spacing));
                font-family: var(--step-title-font);
                color: var(--unfilled-color);
                font-size: var(--font-size);
                transition: color var(--animation-speed), width var(--animation-speed);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                user-select: none;
                font-weight: var(--step-label-font-weight);

                /* Dynamically set our own title width via the 2 'known' attributes updated on resizes and render */
                --title-clearance: 8px;
                width: calc(
                            var(--known-available-width) / (var(--known-step-count) - 1) /* width per segment */
                            * 1px /* Cast to pixels */
                            - (var(--title-clearance) * 2) /* Account for clearance */
                            );  
            }
            
            .progress-steps .progress-step.previous .progress-title {
                color: var(--previous-label-font-color);
            }        

	    </style>
        `)
		);

		this._container = stringToHTML(`<div class="progress-steps"></div>`);
		this._shadowRoot.appendChild(this._container);

		// Add class to container
		this._container.classList.add('progress-steps');

		// Default the options
		this._defaultOptions = {
			steps: [],
			allowStepZero: true,
			events: {
				onStepChanged: function (stepNumber, stepData) {},
			},
		};

		// Set up auto resizing
		let self = this;

		// Handle debouncing window resizes to resize labels & control
		var stepperResizeDebounce;
		let windowResizeDebounceIntervalMilliseconds = 100; /* To prevent slowdown, only look for window size changes 10 times a second */
		this._updateKnownControlSize = function () {
			clearTimeout(stepperResizeDebounce);
			stepperResizeDebounce = setTimeout(function () {
				if (self._options === null || self._options.steps === null)
					return;
				self._container.style.setProperty(
					'--known-step-count',
					self._options.steps.length
				);
				self._container.style.setProperty(
					'--known-available-width',
					self.getBoundingClientRect().width
				);
			}, windowResizeDebounceIntervalMilliseconds);
		};
		this._updateKnownControlSize();
		window.addEventListener('resize', this._updateKnownControlSize, false);
		window.addEventListener(
			'orientationchange',
			this._updateKnownControlSize,
			false
		);
	}

	// Sets options
	init(options) {
		// Overlay default options on user options
		this._options = deepExtend({}, this._defaultOptions, options);

		// Give steps their numbers
		this._options.steps.forEach((step, index) => {
			step.number = index + 1;
		});

		// Initialize stepper state
		if (this._options.steps.length) {
			this._stepNumber = 1;
		} else {
			this._stepNumber = -1;
			console.warn('You must provide at least 1 step');
		}

		// Render
		this._render();
	}

	// Renders the stepper control
	_render() {
		// Empty the container
		while (this._container.firstChild)
			this._container.removeChild(this._container.firstChild);

		// Toss in the progress bar
		this._container.appendChild(
			stringToHTML(`<div class="completion-bar"></div>`)
		);

		// For each step, generate an element
		let countOfCustomSteps = this._options.steps.filter(
			(s) => s.numberDisplay !== undefined
		).length;
		let hasCustomSteps = countOfCustomSteps > 1;
		let automatedStepNumber = 1;

		if (
			countOfCustomSteps !== this._options.steps.length &&
			countOfCustomSteps !== 0
		) {
			throw 'Either all or none of your steps can have numberDisplay specified';
		}

		this._options.steps.forEach((step) => {
			let stepNumber = hasCustomSteps
				? step.numberDisplay
				: automatedStepNumber++;

			let newStepElement = stringToHTML(`
              <div class="progress-step" data-step-number="${stepNumber}">
          	    <div class="progress-title">${step.name}</div>
              </div>
            `);

			// Add titles to steps with names
			if (step.name != '') {
				newStepElement.setAttribute('title', step.name);
			}

			// Disable the disabled steps
			if (step.disabled) {
				newStepElement.classList.add('disabled');
			}
			this._container.appendChild(newStepElement);
		});

		// Bind click event to step orbs
		let self = this;
		this._container
			.querySelectorAll('.progress-step:not(.disabled)')
			.forEach((el) => {
				el.addEventListener('click', function (e) {
					let closestStepParent = e.target.closest('.progress-step');
					if (
						closestStepParent !== undefined &&
						closestStepParent !== null
					) {
						let clickedStep =
							Array.from(
								self._container.querySelectorAll(
									'.progress-step'
								)
							).indexOf(closestStepParent) + 1;
						self._setStepInternal(clickedStep);
					}
				});
			});

		if (this !== undefined) this._setStepInternal();

		setTimeout(this._updateKnownControlSize, 100);
	}

	// Functions
	getStep() {
		return this._getStepInternal();
	}

	setStep(step) {
		if (step === 0 && !this._options.allowStepZero) {
			console.warn('Cannot set to step 0');
		}

		if (step > -1 && step <= this._options.steps.length) {
			if (step > 0 && this._options.steps[step - 1].disabled) {
				console.warn('Cant set to disabled step');
			} else {
				// Set the step
				this._stepNumber = step;
				this._setStepInternal();
			}
		} else {
			console.warn('Step out of range');
		}
	}

	stepUp() {
		this._stepUpInternal();
	}
	stepDown() {
		this._stepDownInternal();
	}
	disableStep(step) {
		// Disable it
		this._options.steps[step - 1].disabled = true;
		// If we're on the disabled step, climb back down
		if (this._stepNumber === step) {
			let stop = false;
			while (
				!stop &&
				this._options.steps[this._stepNumber - 1].disabled === true
			) {
				this._stepNumber--;
				// Always give up and allow zero/nothing, if everything before is also disabled
				if (this._stepNumber === 0) {
					stop = true;
				}
			}
		}

		// Redraw
		this._render();
	}
	enableStep(step) {
		this._options.steps[step - 1].disabled = false;
		// Redraw
		this._render();
	}

	// Internal methods
	_getStepInternal() {
		if (this._stepNumber > 0) {
			return this._options.steps[this._stepNumber - 1];
		} else {
			return null;
		}
	}
	_stepUpInternal() {
		if (
			this._stepNumber < this._options.steps.length &&
			!this._options.steps[this._stepNumber].disabled
		) {
			this._stepNumber++;
			this._setStepInternal();
		}
	}
	_stepDownInternal() {
		if (this._stepNumber > 0) {
			this._stepNumber--;

			if (this._stepNumber === 0 && !this._options.allowStepZero)
				this._stepNumber = 1;

			this._setStepInternal();
		}
	}

	_setStepInternal(step) {
		if (step === undefined) step = this._stepNumber;
		else this._stepNumber = step;

		let percent = ((step - 1) / (this._options.steps.length - 1)) * 100;

		// Size the completion bar
		this._container.querySelector(
			'.completion-bar'
		).style.width = `calc(${percent}% - (var(--step-width)/2))`;

		// Theme the step orbs
		this._container.querySelectorAll('.progress-step').forEach((el) => {
			el.classList.remove('previous');
			el.classList.remove('current');
			el.classList.remove('future');
		});

		this._container
			.querySelectorAll('.progress-step')
			.forEach(function (el, index) {
				if (index + 1 < step) {
					el.classList.add('previous');
				}
				if (index + 1 === step) {
					el.classList.add('current');
				}
				if (index + 1 > step) {
					el.classList.add('future');
				}
			});

		// Call any callbacks
		if (
			this._options.events.onStepChanged &&
			typeof this._options.events.onStepChanged === 'function'
		) {
			let stepData = this._getStepInternal();
			this._options.events.onStepChanged(step, stepData);
		}
	}
}

// Register the custom element
customElements.define('progress-steps', ProgressSteps);
