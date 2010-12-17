/**
 * @author Ed Spencer
 * @class Ext.util.Dispatcher
 * @extends Ext.util.Observable
 * 
 * <p>The Dispatcher class is used to send requests through to a controller action. Usually, only a single Dispatcher
 * is required on the page, and by default a single instance is already created - {@link Ext.Dispatcher}. See the
 * {@link Ext.Dispatcher Dispatcher docs} for details on how this works.</p>
 * 
 * @constructor
 */
Ext.util.Dispatcher = Ext.extend(Ext.util.Observable, {
    
    constructor: function(config) {
        this.addEvents(
            /**
             * @event before-dispatch
             * Fires before an interaction is dispatched. Return false from any listen to cancel the dispatch
             * @param {Ext.Interaction} interaction The Interaction about to be dispatched
             */
            'before-dispatch',
            
            /**
             * @event dispatch
             * Fired once an Interaction has been dispatched
             * @param {Ext.Interaction} interaction The Interaction that was just dispatched
             */
            'dispatch'
        );
        
        Ext.util.Dispatcher.superclass.constructor.call(this, config);
    },
    
    /**
     * Dispatches a single interaction to a controller/action pair
     * @param {Object} options Options representing at least the controller and action to dispatch to
     */
    dispatch: function(options) {
        var interaction = new Ext.Interaction(options),
            controller  = interaction.controller,
            action      = interaction.action,
            History     = Ext.History;
        
        if (this.fireEvent('before-dispatch', interaction) !== false) {
            if (History && options.historyUrl) {
                History.suspendEvents(false);
                History.add(options.historyUrl);
                Ext.defer(History.resumeEvents, 100, History);
            }
            
            if (controller && action) {
                controller[action].call(controller, interaction);
                interaction.dispatched = true;
            }
            
            this.fireEvent('dispatch', interaction);
        }
    },
    
    /**
     * Dispatches to a controller/action pair, adding a new url to the History stack
     */
    redirect: function(options) {
        if (options instanceof Ext.data.Model) {
            //compose a route for the model
            
        } else if (typeof options == 'string') {
            //use router
            var route = Ext.Router.recognize(options);
            
            if (route) {
                return this.dispatch(route);
            }
        }
        return null;
    },
    
    /**
     * Convenience method which returns a function that calls Ext.Dispatcher.redirect. Useful when setting
     * up several listeners that should redirect, e.g.:
<pre><code>
myComponent.on({
    homeTap : Ext.Dispatcher.createRedirect('home'),
    inboxTap: Ext.Dispatcher.createRedirect('inbox'),
});
</code></pre>
     * @param {String/Object} url The url to create the redirect function for
     * @return {Function} The redirect function
     */
    createRedirect: function(url) {
        return function() {
            Ext.Dispatcher.redirect(url);
        };
    }
});

/**
 * @class Ext.Dispatcher
 * @extends Ext.util.Dispatcher
 * 
 * <p>The Dispatcher is responsible for sending requests through to a specific {@link Ext.Controller controller} 
 * action. It is usually invoked either by a UI event handler calling {@link Ext#dispatch}, or by the 
 * {@link Ext.Router Router} recognizing a change in the page url.</p>
 * 
 * <p>Ext.Dispatcher is the default instance of {@link Ext.util.Dispatcher} that is automatically created for every
 * application. Usually it is the only instance that you will need.</p>
 * 
 * <p>Let's say we have an application that manages instances of a Contact model using a contacts controller:</p>
 * 
<pre><code>
Ext.regModel('Contact', {
    fields: ['id', 'name', 'email']
});

//the controller has a single action - list - which just loads the Contacts and logs them to the console
Ext.regController('contacts', {
    list: function() {
        new Ext.data.Store({
            model: 'Contact',
            autoLoad: {
                callback: function(contacts) {
                    console.log(contacts);
                }
            }
        });
    }
});
</code></pre>
 * 
 * <p>We can easily dispatch to the contacts controller's list action from anywhere in our app:</p>
 * 
<pre><code>
Ext.dispatch({
    controller: 'contacts',
    action    : 'list',
    
    historyUrl: 'contacts/list',
    
    anotherOption: 'some value'
});
</code></pre>
 * 
 * <p>The Dispatcher finds the contacts controller and calls its list action. We also passed in a couple of additional
 * options to dispatch - historyUrl and anotherOption. 'historyUrl' is a special parameter which automatically changes
 * the browser's url when passed. For example, if your application is being served from http://yourapp.com, dispatching
 * with the options we passed above would update the url to http://yourapp.com/#contacts/list, as well as calling the 
 * controller action as before.</p>
 * 
 * <p>We also passed a second configuration into dispatch - anotherOption. We can access this inside our controller 
 * action like this:</p>
 * 
<pre><code>
Ext.regController('contacts', {
    list: function(options) {
        console.log(options.anotherOption); // 'some value'
    }
});
</code></pre>
 * 
 * <p>We can pass anything in to Ext.dispatch and have it come through to our controller action. Internally, all of the
 * options that we pass to dispatch are rolled into an {@link Ext.Interaction}. Interaction is a very simple class that
 * represents a single request into the application - typically the controller and action names plus any additional 
 * information like the Model instance that a particular action is concerned with.</p>
 * 
 * @singleton
 */
Ext.Dispatcher = new Ext.util.Dispatcher();

/**
 * Shorthand for {@link Ext.Dispatcher#dispatch}. Dispatches a request to a controller action
 * 
 * @member Ext
 * @method dispatch
 */
Ext.dispatch = function() {
    return Ext.Dispatcher.dispatch.apply(Ext.Dispatcher, arguments);
};

/**
 * Shorthand for {@link Ext.Dispatcher#redirect}. Dispatches a request to a controller action, adding to the History
 * stack and updating the page url as necessary.
 * 
 * @member Ext
 * @method redirect
 */
Ext.redirect = function() {
    return Ext.Dispatcher.redirect.apply(Ext.Dispatcher, arguments);
};

Ext.createRedirect = Ext.Dispatcher.createRedirect;