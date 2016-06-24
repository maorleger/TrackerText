


///////////////////////// HELPER FUNCTIONS ///////////////////////////////

var parseText = function(raw_text, regex) {
  let retVal = {
    full_match: '',
    parsed_value: ''
  };
  if (raw_text && raw_text.length > 0) {
    let match = regex.exec(raw_text);
    if (match && match.length > 0) {
      retVal.full_match = match[0];
      retVal.parsed_value = match[1];
    }
  }
  return retVal;
}

var buildDescription = function(raw_text) {
  for (var i = 1; i < arguments.length; i++) {
    raw_text = raw_text.replace(arguments[i].full_match, '');
  }
  return raw_text.replace(/\s+/g, ' ');
}

var buildJson = function(raw_text = "") {
  let estimate = parseText(raw_text, /\best:([0-3])\b/g);
  let name = parseText(raw_text, /\bnm:(.*)\\nm\b/g);
  let story_type = parseText(raw_text, /\btype:(feature|bug|chore|release)\b/g);
  let integration_id = parseText(raw_text, /\bintid:(\d+)\b/g);
  let current_state = parseText(raw_text, /\bstate:(accepted|delivered|finished|started|rejected|planned|unstarted|unscheduled)\b/g)
  let json = {
    description: buildDescription(raw_text, estimate, name, story_type, integration_id, current_state)
  };
  if (estimate.parsed_value) {
    json['estimate'] = estimate.parsed_value;
  }  
  json['name'] = name.parsed_value || json['description'];
  if (story_type.parsed_value) {
    json['story_type'] = story_type.parsed_value;
  }
  if (integration_id.parsed_value) {
    json['integration_id'] = integration_id.parsed_value;
  }
  if (current_state.parsed_value) {
    json['current_state'] = current_state.parsed_value;
  }
  return json;
}



////////////////////////////////// COMPONENTS //////////////////////////////


class Tracker extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      project_id: "",
      json: buildJson(),
      story_url: "",
      result: "Parser",
      alert_class: "info",
    }
    this.handleDropdownChange = this.handleDropdownChange.bind(this);
    this.updateText = this.updateText.bind(this);
    this.submitStory = this.submitStory.bind(this);
  }
  submitStory() {
    var serverRequest = $.ajax(
      this.props.baseTrackerUrl + this.state.project_id + "/stories",
      {
        headers: {"X-TrackerToken": this.props.token},
        data: this.state.json,
        dataType: "json",
        type: "POST",
      }
    )
    .done(function(response) {
      this.setState(
        {
          json: response,
          result: "Success",
          alert_class: "success",
          story_url: response.url,
        }
      );
    }.bind(this))
    .error(function(response) {
      this.setState(
        {
          json: response,
          result: "Failure",
          alert_class: "danger",
          story_url: "",
        }
      );
    }.bind(this));
  }
  handleDropdownChange(e) {    
    this.setState(
      { 
        project_id: e.target.value,
      }
    );
  }
  updateText(raw_text) {    
    this.setState(
    {
      json: buildJson(raw_text.target.value),
      result: "Parser",
      alert_class: "info",
      story_url: "",
    });
  }
  render() {
    return (
      <div className="Tracker">
        <TrackerProjectDropdown 
          url={this.props.baseTrackerUrl} 
          token={this.props.token} 
          onChange={this.handleDropdownChange}
        />
        <TrackerInput updateText={this.updateText} />
        <TrackerOutput 
          json={this.state.json} 
          project_id={this.state.project_id}
          story_url={this.state.story_url}
          result={this.state.result}
          alert_class={this.state.alert_class}
        />
        <TrackerSubmit onClick={this.submitStory} />
      </div>
    );
  }
}

class TrackerProjectDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {projects: []}
  }
  componentDidMount() {
    var serverRequest = $.ajax(
      this.props.url,
      {
        headers: {"X-TrackerToken": this.props.token}
      }
    )
    .done(function(projects) {
      this.setState({
        projects: projects
      });
    }.bind(this));
  }
  componentWillUnmount() {
    this.serverRequest.abort();
  }
  render() {
    return (
      <div className="TrackerProjectDropdown">
        <fieldset class="form-group">
          <label for="project-ddl">Project</label>
          <select onChange={this.props.onChange}
            className="form-control" id="project-ddl">
            <option key="" value="">-- Please Select</option>
            {this.state.projects.map(function(project) {
              return <option key={project.id} value={project.id}>{project.name}</option>
            })}
          </select>
        </fieldset>
      </div>
    );    
  }
}

class TrackerInput extends React.Component {
  render() {
    return (
      <div className="TrackerInput">
        <fieldset class="form-group">
          <label for="story-txt">Story Data</label>
          <textarea type="text" className="form-control"
                    name="text" id="story-txt" ref="text"
                    onChange={this.props.updateText.bind(this)}                    
                    placeholder="Track It Up!" />
        </fieldset>
      </div>
    );
  }
}

const TrackerOutput = (props) =>
  <div className="TrackerOutput">
    <hr />
    <div className={"alert alert-" + props.alert_class}>
      <strong>{props.result} Output:</strong>
    </div>
    <p><a href={props.story_url} target="_blank">{props.story_url}</a></p>
    <pre>{JSON.stringify(props.json, null, 2)}</pre>
    <pre>project_id:{props.project_id}</pre>
  </div>

const TrackerSubmit = (props) =>
  <div className="TrackerSubmit">
    <input type="submit" onClick={props.onClick} class="btn btn-primary" value="Create Story!"/>
  </div>

ReactDOM.render(
  <Tracker 
    token="b7596fdfbece137e5908609d0ed6e3b2" 
    baseTrackerUrl="https://www.pivotaltracker.com/services/v5/projects/"
  />,
  document.getElementById('content')
);




