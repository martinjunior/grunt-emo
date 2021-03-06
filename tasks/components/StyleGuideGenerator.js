(function() {
    'use strict';

    var EMOGen = require('emo-gen');
    var objectAssign = require('object-assign');

    /**
     * A grunt style guide generator
     * 
     * @param {Object} grunt
     * @param {Array} gruntFilesArray  an unexpanded grunt file array
     * @param {Object} gruntOptions  grunt task options
     */
    var StyleGuideGenerator = function(grunt, gruntFilesArray, gruntOptions) {
        /**
         * @property styleGuideGenerator.grunt
         * @type {Object}
         */
        this.grunt = grunt;

        /**
         * An unexpanded grunt file array
         * 
         * @property styleGuideGenerator.gruntFilesArray
         * @type {Array}
         */
        this.gruntFilesArray = gruntFilesArray;

        /**
         * Grunt task options
         * 
         * @property styleGuideGenerator.gruntOptions
         * @type {Array}
         */
        this.gruntOptions = objectAssign(StyleGuideGenerator.OPTIONS, gruntOptions);

        /**
         * An emo-gen instance
         * 
         * @property styleGuideGenerator.generator
         */
        this.generator = new EMOGen(
            this.gruntOptions,
            this.gruntOptions.nunjucksOptions
        );
    };

    StyleGuideGenerator.OPTIONS = {
        components: []
    };

    /**
     * Convert a grunt files object to a
     * grunt file mapping options object
     * (http://gruntjs.com/api/grunt.file#grunt.file.expandmapping)
     * 
     * @method StyleGuideGenerator.createGruntFileMappingOptions
     * @return {Object} gruntFileMappingOptions
     * @static
     */
    StyleGuideGenerator.createGruntFileMappingOptions = function(gruntFilesObject) {
        var gruntFileMappingOptions = objectAssign({}, gruntFilesObject);

        // delete those properties we don't need
        delete gruntFileMappingOptions.src;
        delete gruntFileMappingOptions.dest;

        return gruntFileMappingOptions;
    };

    var proto = StyleGuideGenerator.prototype;

    /**
     * Build the style guide
     * 
     * @method styleGuideGenerator.build
     * @return {Object} a promise
     */
    proto.build = function() {
        return this.generator.place().then(function() {
            var files = this.expandGruntFilesArray(this.gruntFilesArray);

            return this.generator.copy(files);
        }.bind(this)).then(function(filesCopied) {
            this.grunt.log.writeln('Copied ' + filesCopied.length + ' file(s)');

            return this.generator.build(
                this.gruntOptions.components,
                this.gruntOptions.views
            );
        }.bind(this)).then(function() {
            var components = this.generator.componentsCollection.components;
            var views = this.generator.viewsCollection.views;

            this.grunt.log.writeln('Documented ' + this.getComponentsTotal(components) + ' component(s)');
            this.grunt.log.writeln('Created ' + views.length + ' view(s)');
        }.bind(this));
    };

    /**
     * Expand grunt files array
     * 
     * @method styleGuideGenerator.expandGruntFilesArray
     * @return {Object} gruntFilesMappingList
     */
    proto.expandGruntFilesArray = function(gruntFilesArray) {
        var gruntFilesMappingList = [];

        if (!gruntFilesArray) {
            return gruntFilesMappingList;
        }

        gruntFilesArray.forEach(function(gruntFilesObject) {
            this.grunt.file.expandMapping(
                gruntFilesObject.src,
                gruntFilesObject.dest,
                StyleGuideGenerator.createGruntFileMappingOptions(gruntFilesObject)
            ).forEach(function(srcDestFileMapping) {
                var flattenedArray = [];
                var dest = srcDestFileMapping.dest;

                srcDestFileMapping.src.forEach(function(src) {
                    flattenedArray.push({
                        src: src,
                        dest: dest
                    });
                });

                gruntFilesMappingList = gruntFilesMappingList.concat(flattenedArray);
            });
        }.bind(this));

        return gruntFilesMappingList;
    };

    /**
     * Return the total number of components
     * found in the provided components collection
     * 
     * @param {Object} components  a components collection
     * @return {Number} total number of components found
     */
    proto.getComponentsTotal = function(components) {
        var total = 0;
        var categories = Object.keys(components);

        categories.forEach(function(category) {
            components[category].forEach(function(comonent) {
                total++;
            });
        });

        return total;
    };

    module.exports = StyleGuideGenerator;

} ());